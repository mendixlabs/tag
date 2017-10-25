import { Component, createElement } from "react";

import { BootstrapStyle, Tag } from "./Tag";
import { parseStyle } from "../utils/ContainerUtils";

interface WrapperProps {
    class?: string;
    mxObject: mendix.lib.MxObject;
    readOnly: boolean;
    style?: string;
}

export interface TagContainerProps extends WrapperProps {
    afterCreateMicroflow: string;
    allowDrag: boolean;
    tagStyle: BootstrapStyle;
    editable: "default" | "never";
    enableSuggestions: boolean;
    enableCreate: boolean;
    inputPlaceholder: string;
    onChangeMicroflow: string;
    lazyLoad: boolean;
    tagAttribute: string;
    tagConstraint: string;
    tagEntity: string;
    tagLimit: number;
    tagLimitMessage: string;
}

export interface TagState {
    alertMessage?: string;
    suggestions: string[];
    tagList: string[];
    newTag: string;
}

class TagContainer extends Component<TagContainerProps, TagState> {
    private subscriptionHandles: number[] = [];
    private tagEntity: string;
    private tagAttribute: string;
    private referenceAttribute: string;

    constructor(props: TagContainerProps) {
        super(props);

        this.state = {
            suggestions: [],
            newTag: this.getValue(props.tagAttribute, props.mxObject) as string,
            tagList: []
        };
        this.createTag = this.createTag.bind(this);
        this.handleSubscriptions = this.handleSubscriptions.bind(this);
        this.lazyLoadTags = this.lazyLoadTags.bind(this);
        this.processTags = this.processTags.bind(this);
        this.removeTag = this.removeTag.bind(this);
        this.showErrorMessage = this.showErrorMessage.bind(this);

        this.tagAttribute = props.tagAttribute.split("/")[props.tagAttribute.split("/").length - 1];
        this.tagEntity = props.tagEntity.split("/")[props.tagEntity.split("/").length - 1];
        this.referenceAttribute = props.tagEntity.split("/")[0]; // change to .length -1 instead of [0]
    }

    render() {
        return createElement(Tag, {
            alertMessage: this.state.alertMessage,
            tagStyle: this.props.tagStyle,
            className: this.props.class,
            createTag: this.createTag,
            enableSuggestions: this.props.enableSuggestions,
            inputPlaceholder: this.props.inputPlaceholder,
            lazyLoad: this.props.lazyLoad,
            lazyLoadTags: this.lazyLoadTags,
            newTag: this.state.newTag,
            onRemove: this.removeTag,
            readOnly: this.isReadOnly(),
            showError: this.showErrorMessage,
            style: parseStyle(this.props.style),
            suggestions: this.state.suggestions,
            tagLimit: this.props.tagLimit,
            tagLimitMessage: this.props.tagLimitMessage,
            tagList: this.state.tagList
        });
    }

    componentWillReceiveProps(newProps: TagContainerProps) {
        if (!this.props.lazyLoad) {
            this.fetchCurrentTags(newProps.mxObject);
        }
        this.resetSubscriptions(newProps.mxObject);
    }

    componentWillUnmount() {
        this.subscriptionHandles.forEach(mx.data.unsubscribe);
    }

    private showErrorMessage(message: string) {
        window.mx.ui.error(message);
    }

    private getValue(attribute: string, mxObject?: mendix.lib.MxObject): string {
        return mxObject ? (mxObject.get(attribute) as string) : "";
    }

    private isReadOnly() {
        const { editable, mxObject, readOnly } = this.props;
        if (editable === "default" && mxObject) {
            return readOnly || mxObject.isReadonlyAttr(this.tagAttribute);
        }

        return true;
    }

    private resetSubscriptions(mxObject?: mendix.lib.MxObject) {
        this.subscriptionHandles.forEach(window.mx.data.unsubscribe);

        if (mxObject) {
            this.subscriptionHandles.push(mx.data.subscribe({
                callback: this.handleSubscriptions,
                guid: mxObject.getGuid()
            }));

            this.subscriptionHandles.push(mx.data.subscribe({
                attr: this.tagAttribute,
                callback: this.handleSubscriptions,
                guid: mxObject.getGuid()
            }));
        }
    }

    private handleSubscriptions() {
        this.setState({
            newTag: this.getValue(this.tagAttribute, this.props.mxObject) as string
        });
    }

    private lazyLoadTags() {
        if (this.props.mxObject) {
            this.fetchCurrentTags(this.props.mxObject);
        }
    }

    private fetchCurrentTags(mxObject: mendix.lib.MxObject) {
        const { tagConstraint } = this.props;
        const constraint = tagConstraint
            ? tagConstraint.replace(/\[\%CurrentObject\%\]/gi, mxObject.getGuid())
            : "";
        const XPath = "//" + this.tagEntity + constraint;
        mx.data.get({
            callback: object => {
                const suggestionList = object.map(tagObject => ({
                    value: tagObject.get(this.tagAttribute) as string
                }));
                this.setState({ suggestions: suggestionList.map(suggestion => suggestion.value) });
                this.processTags(object);
            },
            error: error =>
                window.mx.ui.error(`An error occurred while retrieving tags via XPath (${this.tagEntity}): ${error}`),
            xpath: XPath
        });
    }

    private processTags(tagObjects: any[]) {
        const currentTagObjects: mendix.lib.MxObject[] = [];
        const referenceTags = this.props.mxObject.get(this.referenceAttribute) as string[];
        tagObjects.map(object => {
            referenceTags.map(reference => {
                if (reference === object.getGuid()) {
                    currentTagObjects.push(object);
                }
            });
        });
        const tagData = currentTagObjects.map(tagObject => ({ value: tagObject.get(this.tagAttribute) as string }));
        this.setState({
            tagList: tagData.map(tag => tag.value)
        });
    }

    private createTag(tag: string) {
        const { afterCreateMicroflow, mxObject } = this.props;
        mx.data.create({
            callback: object => {
                object.set(this.tagAttribute, tag);
                mx.data.commit({
                    callback: () => {
                        mxObject.addReference(this.referenceAttribute, object.getGuid());
                        this.saveTag(mxObject);

                        if (afterCreateMicroflow) {
                            this.executeAction(afterCreateMicroflow, object.getGuid());
                        }
                    },
                    error: error => window.mx.ui.error("Error occurred attempting to commit: " + error),
                    mxobj: object
                });
            },
            entity: this.tagEntity,
            error: error => window.mx.ui.error(`Error creating tag object ${this.tagEntity}, ${error.message}`)
        });
    }

    private saveTag(object: mendix.lib.MxObject) {
        mx.data.commit({
            mxobj: object,
            callback: () => undefined
        });
    }

    private removeTag(name: string) {
        const { onChangeMicroflow, mxObject } = this.props;
        mx.data.get({
            callback: (object) => {
                mxObject.removeReferences(this.referenceAttribute, object[0].getGuid() as any);
                this.saveTag(mxObject);
                if (onChangeMicroflow) {
                    this.executeAction(onChangeMicroflow, object[0].getGuid());
                }
            },
            error: (error) => (`${error.message}, and ${error.stack}`),
            xpath: `//${this.tagEntity}[ ${this.tagAttribute} = '${name}' ]`
        });
    }

    private executeAction(actionName: string, guid: string) {
        if (actionName) {
           window.mx.ui.action(actionName, {
                error: error =>
                    window.mx.ui.error(`Error while executing microflow: ${actionName}: ${error.message}`),
                params: {
                    applyto: "selection",
                    guids: [ guid ]
                }
            });
        }
    }
}

export default TagContainer;
