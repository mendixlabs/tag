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
    isReference: boolean;
    alertMessage?: string;
    suggestions: string[];
    tagList: string[];
    newTag: string;
    tagCache: mendix.lib.MxObject[];
}

export default class TagContainer extends Component<TagContainerProps, TagState> {
    private subscriptionHandles: number[] = [];
    private tagEntity: string;
    private tagAttribute: string;
    private referenceAttribute: string;

    constructor(props: TagContainerProps) {
        super(props);

        this.state = {
            isReference: false,
            newTag: "",
            suggestions: [],
            tagCache: [],
            tagList: []
        };
        this.createTag = this.createTag.bind(this);
        this.processTagData = this.processTagData.bind(this);
        this.lazyLoadSuggestions = this.lazyLoadSuggestions.bind(this);
        this.removeTag = this.removeTag.bind(this);
        this.showErrorMessage = this.showErrorMessage.bind(this);

        this.tagAttribute = props.tagAttribute.split("/")[props.tagAttribute.split("/").length - 1];
        this.tagEntity = props.tagEntity.split("/")[props.tagEntity.split("/").length - 1];
        this.referenceAttribute = props.tagEntity.split("/")[0];
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
            lazyLoadTags: this.lazyLoadSuggestions,
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
            this.fetchTagData(newProps.mxObject);
        }
        this.resetSubscriptions(newProps.mxObject);
    }

    componentWillUnmount() {
        this.subscriptionHandles.forEach(mx.data.unsubscribe);
    }

    private showErrorMessage(message: string) {
        return window.mx.ui.error(message);
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
                callback: guid => {
                    mx.data.get({
                        guid: guid.toString(),
                        callback: object => this.fetchTagData(object)
                    });
                },
                guid: mxObject.getGuid()
            }));

            this.subscriptionHandles.push(mx.data.subscribe({
                attr: this.referenceAttribute,
                callback: guid => {
                    mx.data.get({
                        guid: guid.toString(),
                        callback: object => this.fetchTagData(object)
                    });
                },
                guid: mxObject.getGuid()
            }));

            this.subscriptionHandles.push(mx.data.subscribe({
                guid: mxObject.getGuid(),
                val: true,
                callback: validations => {
                    window.mx.ui.error(validations[0].getErrorReason(this.referenceAttribute));
                }
            }));
        }
    }

    private lazyLoadSuggestions() {
       this.fetchTagData(this.props.mxObject);
    }

    private fetchTagData(mxObject: mendix.lib.MxObject) {
        const { tagConstraint } = this.props;
        const constraint = tagConstraint
            ? tagConstraint.replace(/\[\%CurrentObject\%\]/gi, mxObject.getGuid())
            : "";
        const XPath = "//" + this.tagEntity + constraint;
        mx.data.get({
            callback: object => this.processTagData(object),
            error: error =>
                window.mx.ui.error(`An error occurred while retrieving tags via XPath (${this.tagEntity}):
                ${error.message}`),
            xpath: XPath
        });
    }

    private processTagData(tagObjects: mendix.lib.MxObject[]) {
        const currentTagObjects: mendix.lib.MxObject[] = [];
        const referenceTags = this.props.mxObject.get(this.referenceAttribute) as string[];
        const getSuggestions = tagObjects.map(object => ({ value: object.get(this.tagAttribute) as string }));

        tagObjects.map(object => {
            if (referenceTags.toString() !== "") {
                referenceTags.map(reference => {
                    if (reference === object.getGuid()) {
                        currentTagObjects.push(object);
                    }
                });
            }
        });
        const getTags = currentTagObjects !== []
        ? currentTagObjects.map(object => ({ value: object.get(this.tagAttribute) as string }))
        : [];

        this.setState({
            tagCache: tagObjects,
            tagList: getTags.map(tag => tag.value),
            suggestions: getSuggestions.map(suggestion => suggestion.value)
        });
    }

    private createTag(value: string) {
        const { afterCreateMicroflow, mxObject } = this.props;
        for (const object of this.state.tagCache) {
            const tagValue = object.get(this.tagAttribute) as string;
            if (value === tagValue) {
                mxObject.addReference(this.referenceAttribute, object.getGuid());
                this.saveTagData(mxObject);

                return;
            }
        }
        mx.data.create({
            callback: object => {
                object.set(this.tagAttribute, value);
                mx.data.commit({
                    callback: () => {
                        mxObject.addReference(this.referenceAttribute, object.getGuid());
                        this.saveTagData(mxObject, afterCreateMicroflow, object.getGuid());
                    },
                    error: error => window.mx.ui.error("Error occurred attempting to commit: " + error.message),
                    mxobj: object
                });
            },
            entity: this.tagEntity,
            error: error => window.mx.ui.error(`Error creating tag object ${this.tagEntity}, ${error.message}`)
        });
    }

    private removeTag(value: string) {
        if (value.trim() !== "") {
            const { onChangeMicroflow, mxObject } = this.props;
            mx.data.get({
                callback: (object) => {
                    mxObject.removeReferences(this.referenceAttribute, object[0].getGuid() as any);
                    this.saveTagData(mxObject, onChangeMicroflow, object[0].getGuid());
                },
                error: error => `${error.message}`,
                xpath: `//${this.tagEntity}[ ${this.tagAttribute} = '${value}' ]`
            });
        }
    }

    private saveTagData(object: mendix.lib.MxObject, action?: string, guid?: string) {
        mx.data.commit({
            mxobj: object,
            callback: () => {
                if (action && guid) {
                    this.executeAction(action, guid);
                }
            }
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
