import { Component, createElement } from "react";

import { BootstrapStyle, Tag } from "./Tag";
import { parseStyle } from "../utils/Utilities";

interface WrapperProps {
    class?: string;
    mxObject: mendix.lib.MxObject;
    mxform: mxui.lib.form._FormBase;
    readOnly: boolean;
    style?: string;
}

export interface TagContainerProps extends WrapperProps {
    afterCreateMicroflow: string;
    allowDrag: boolean;
    tagStyle: BootstrapStyle;
    editable: "default" | "never";
    enableSuggestions: boolean;
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
    lazyLoaded: boolean;
    tagList: string[];
    newTag: string;
    tagCache: mendix.lib.MxObject[];
}

export default class TagContainer extends Component<TagContainerProps, TagState> {
    private subscriptionHandles: number[] = [];
    private tagEntity: string;
    private referenceAttribute: string;

    constructor(props: TagContainerProps) {
        super(props);

        this.state = {
            isReference: false,
            newTag: "",
            suggestions: [],
            lazyLoaded: false,
            tagCache: [],
            tagList: []
        };
        this.createTag = this.createTag.bind(this);
        this.processTagData = this.processTagData.bind(this);
        this.lazyLoadSuggestions = this.lazyLoadSuggestions.bind(this);
        this.removeTag = this.removeTag.bind(this);
        this.showAlertMessage = this.showAlertMessage.bind(this);

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
            fetchSuggestions: this.lazyLoadSuggestions,
            newTag: this.state.newTag,
            onRemove: this.removeTag,
            readOnly: this.isReadOnly(),
            showError: this.showAlertMessage,
            style: parseStyle(this.props.style),
            suggestions: this.state.suggestions,
            tagLimit: this.props.tagLimit,
            tagLimitMessage: this.props.tagLimitMessage,
            tagList: this.state.tagList
        });
    }

    componentWillReceiveProps(newProps: TagContainerProps) {
        this.fetchTagData(newProps.mxObject);
        this.resetSubscriptions(newProps.mxObject);
    }

    componentWillUnmount() {
        this.subscriptionHandles.forEach(mx.data.unsubscribe);
    }

    private showAlertMessage(message: string) {

        return message;
    }

    private isReadOnly() {
        const { editable, mxObject, readOnly } = this.props;
        if (editable === "default" && mxObject) {
            return readOnly;
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
        this.setState({ lazyLoaded: true });
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
        const currentTags: mendix.lib.MxObject[] = [];
        const referenceTags = this.props.mxObject.getReferences(this.referenceAttribute) as string[];
        const getSuggestions = tagObjects.map(object => ({ value: object.get(this.props.tagAttribute) as string }));

        tagObjects.map(object => {
            if (referenceTags.toString() !== "") {
                referenceTags.map(reference => {
                    if (reference === object.getGuid()) {
                        currentTags.push(object);
                    }
                });
            }
        });
        const getTags = currentTags !== []
        ? currentTags.map(object => ({ value: object.get(this.props.tagAttribute) as string }))
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
            const tagValue = object.get(this.props.tagAttribute) as string;
            if (value === tagValue) {
                this.state.tagList.push(value);
                this.setState({ tagList: this.state.tagList });
                mxObject.addReference(this.referenceAttribute, object.getGuid());
                this.saveTagData(mxObject);

                return;
            }
        }
        mx.data.create({
            callback: object => {
                object.set(this.props.tagAttribute, value);
                mx.data.commit({
                    callback: () => {
                        mxObject.addReference(this.referenceAttribute, object.getGuid());
                        this.saveTagData(mxObject);

                        if (afterCreateMicroflow) {
                            this.executeAction(object, afterCreateMicroflow);
                        }
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
                    if (onChangeMicroflow) {
                        this.executeAction(object[0], onChangeMicroflow);
                    }
                    mxObject.removeReferences(this.referenceAttribute, object[0].getGuid() as any);
                    this.saveTagData(mxObject);
                },
                error: error => `${error.message}`,
                xpath: `//${this.tagEntity}[ ${this.props.tagAttribute} = '${value}' ]`
            });
        }
    }

    private saveTagData(object: mendix.lib.MxObject) {
        mx.data.commit({
            mxobj: object,
            callback: () => undefined
        });
    }

    private executeAction(mxObject: mendix.lib.MxObject, action?: string) {
        if (action) {
            window.mx.ui.action(action, {
                origin: this.props.mxform,
                params: {
                    guids: [ mxObject.getGuid() ],
                    applyto: "selection"
                },
                error: error => window.mx.ui.error(`Error while executing microflow: ${action}: ${error.message}`)
            });
        }
    }
}
