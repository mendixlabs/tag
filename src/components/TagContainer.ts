import { Component, createElement } from "react";

import { BootstrapStyle, Tag } from "./Tag";
import { ValidateConfigs } from "../utils/ValidateConfigs";

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
    inputPlaceholder: string;
    onChangeMicroflow: string;
    lazyLoad: boolean;
    mxform: mxui.lib.form._FormBase;
    tagAttribute: string;
    tagConstraint: string;
    tagEntity: string;
    tagLimit: number;
    tagLimitMessage: string;
}

export interface TagContainerState {
    alertMessage?: string;
    isReference: boolean;
    suggestions: string[];
    lazyLoaded: boolean;
    fetchTags: boolean;
    reloadTagsOnRemove: boolean;
    tagList: string[];
    newTag: string;
    tagCache: mendix.lib.MxObject[];
}

export default class TagContainer extends Component<TagContainerProps, TagContainerState> {
    private subscriptionHandles: number[] = [];
    private tagEntity: string;
    private referenceAttribute: string;

    constructor(props: TagContainerProps) {
        super(props);

        this.state = {
            fetchTags: false,
            isReference: false,
            newTag: "",
            reloadTagsOnRemove: false,
            suggestions: [],
            lazyLoaded: false,
            tagCache: [],
            tagList: []
        };

        this.createTag = this.createTag.bind(this);
        this.processTags = this.processTags.bind(this);
        this.lazyLoadSuggestions = this.lazyLoadSuggestions.bind(this);
        this.removeTag = this.removeTag.bind(this);
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
            style: ValidateConfigs.parseStyle(this.props.style),
            suggestions: this.state.suggestions,
            tagLimit: this.props.tagLimit,
            tagLimitMessage: this.props.tagLimitMessage,
            tagList: this.state.tagList
        });
    }

    componentWillReceiveProps(newProps: TagContainerProps) {
        this.fetchTags(newProps.mxObject);
        this.resetSubscriptions(newProps.mxObject);
    }

    componentWillUnmount() {
        this.subscriptionHandles.forEach(mx.data.unsubscribe);
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
                        callback: object => this.fetchTags(object)
                    });
                },
                guid: mxObject.getGuid()
            }));

            this.subscriptionHandles.push(mx.data.subscribe({
                attr: this.referenceAttribute,
                callback: guid => {
                    mx.data.get({
                        guid: guid.toString(),
                        callback: object => this.fetchTags(object)
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
        this.fetchTags(this.props.mxObject);
    }

    private fetchTags(mxObject: mendix.lib.MxObject) {
        if (!this.state.fetchTags) {
            const { tagConstraint } = this.props;
            const constraint = tagConstraint
                ? tagConstraint.replace(/\[\%CurrentObject\%\]/gi, mxObject.getGuid())
                : "";
            const XPath = "//" + this.tagEntity + constraint;

            mx.data.get({
                callback: object => this.processTags(object),
                error: error =>
                    window.mx.ui.error(`An error occurred while retrieving tags via XPath (${this.tagEntity}):
                ${error.message}`),
                xpath: XPath
            });
        }
    }

    private processTags(tagObjects: mendix.lib.MxObject[]) {
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
            fetchTags: true,
            tagCache: tagObjects,
            tagList: getTags.map(tag => tag.value),
            suggestions: getSuggestions.map(suggestion => suggestion.value)
        });
    }

    private createTag(newTag: string) {
        const { afterCreateMicroflow, onChangeMicroflow, mxObject } = this.props;
        const tagList = this.state.tagList;

        for (const object of this.state.tagCache) {
            const tagValue = object.get(this.props.tagAttribute) as string;
            if (newTag === tagValue && newTag.trim() !== "") {
                tagList.push(newTag);
                mxObject.addReference(this.referenceAttribute, object.getGuid());
                this.saveTagData(mxObject);
                this.setState({ tagList });

                return;
            }
        }
        mx.data.create({
            callback: object => {
                object.set(this.props.tagAttribute, newTag);
                mx.data.commit({
                    callback: () => {
                        mxObject.addReference(this.referenceAttribute, object.getGuid());
                        this.saveTagData(mxObject);
                        if (afterCreateMicroflow || onChangeMicroflow) {
                            this.executeAction(mxObject, afterCreateMicroflow);
                            this.executeAction(mxObject, onChangeMicroflow);
                        }
                    },
                    error: error => window.mx.ui.error("Error occurred attempting to commit: " + error.message),
                    mxobj: object
                });
            },
            entity: this.tagEntity,
            error: error => window.mx.ui.error(`Error creating tag object ${this.tagEntity}, ${error.message}`)
        });

        tagList.push(newTag);
        this.setState({ tagList });
    }

    private removeTag(value: string) {
        if (value.trim() !== "") {
            const { onChangeMicroflow, mxObject } = this.props;
            const tagIndex = this.state.tagList.indexOf(value);
            const tagList = this.state.tagList.slice();

            mx.data.get({
                callback: (object) => {
                    if (onChangeMicroflow) {
                        this.executeAction(mxObject, onChangeMicroflow);
                    }
                    mxObject.removeReferences(this.referenceAttribute, object[0].getGuid() as any);
                    this.saveTagData(mxObject);
                },
                error: error => `${error.message}`,
                xpath: `//${this.tagEntity}[ ${this.props.tagAttribute} = '${value}' ]`
            });

            tagList.splice(tagIndex, 1);
            this.setState({
                alertMessage: "",
                reloadTagsOnRemove: true,
                tagList: tagIndex !== -1 ? tagList : this.state.tagList
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
