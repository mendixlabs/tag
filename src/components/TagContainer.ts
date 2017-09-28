import { Component, createElement } from "react";

import { BootstrapStyle, Tag } from "./Tag";
import { Suggestion } from "./AutoComplete";

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
    suggestions: Suggestion[];
    tags: string[];
    tag: string;
}

class TagContainer extends Component<TagContainerProps, TagState> {
    private subscriptionHandles: number[] = [];

    constructor(props: TagContainerProps) {
        super(props);

        this.state = {
            suggestions: [],
            tag: this.getValue(props.tagAttribute, props.mxObject) as string,
            tags: []
        };
        this.createTag = this.createTag.bind(this);
        this.lazyLoadTags = this.lazyLoadTags.bind(this);
        this.handleSubscriptions = this.handleSubscriptions.bind(this);
        this.showErrorMessage = this.showErrorMessage.bind(this);
    }

    render() {
        return createElement(Tag, {
            alertMessage: this.state.alertMessage,
            tagStyle: this.props.tagStyle,
            className: this.props.class,
            createTag: this.createTag,
            enableCreate: this.props.enableCreate,
            enableSuggestions: this.props.enableSuggestions,
            inputPlaceholder: (this.props.inputPlaceholder !== " ") ? this.props.inputPlaceholder : " ",
            lazyLoad: this.props.lazyLoad,
            lazyLoadTags: this.lazyLoadTags,
            readOnly: this.isReadOnly(),
            showError: this.showErrorMessage,
            style: TagContainer.parseStyle(this.props.style),
            tagLimit: this.props.tagLimit,
            tagLimitMessage: this.props.tagLimitMessage,
            tags: this.state.tags,
            tagValue: this.state.tag
        });
    }

    componentWillReceiveProps(newProps: TagContainerProps) {
        if (newProps.mxObject !== this.props.mxObject) {
            if (!this.props.lazyLoad) { this.fetchCurrentTags(newProps.mxObject); }
            this.resetSubscriptions(newProps.mxObject);
        }
    }

    componentWillUnmount() {
        this.subscriptionHandles.forEach(mx.data.unsubscribe);
    }

    private showErrorMessage(message: string) {
        window.mx.ui.error(message);
    }

    public static parseStyle(style = ""): {[key: string]: string} {
        try {
            return style.split(";").reduce<{[key: string]: string}>((styleObject, line) => {
                const pair = line.split(":");
                if (pair.length === 2) {
                    const name = pair[0].trim().replace(/(-.)/g, match => match[1].toUpperCase());
                    styleObject[name] = pair[1].trim();
                }
                return styleObject;
            }, {});
        } catch (error) {
            // tslint:disable-next-line no-console
            console.log("Failed to parse style", style, error);
        }

        return {};
    }

    private getValue(attribute: string, mxObject?: mendix.lib.MxObject): string {
        return mxObject ? (mxObject.get(attribute) as string) : "";
    }

    private isReadOnly() {
        const { tagAttribute, editable, mxObject, readOnly } = this.props;
        if (editable === "default" && mxObject) {
            return readOnly || mxObject.isReadonlyAttr(tagAttribute);
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
                attr: this.props.tagAttribute,
                callback: this.handleSubscriptions,
                guid: mxObject.getGuid()
            }));
        }
    }

    private handleSubscriptions() {
        this.setState({
            tag: this.getValue(this.props.tagAttribute, this.props.mxObject) as string
        });
    }

    private lazyLoadTags() {
        if (this.props.mxObject) {
            this.fetchCurrentTags(this.props.mxObject);
        }
    }

    private fetchCurrentTags(mxObject: mendix.lib.MxObject) {
        const { tagAttribute, tagConstraint, tagEntity } = this.props;
        const constraint = tagConstraint
            ? tagConstraint.replace(/\[\%CurrentObject\%\]/gi, mxObject.getGuid())
            : "";
        const XPath = "//" + tagEntity + constraint;
        mx.data.get({
            callback: object => {
                const tagData = object.map(tagObject => ({
                    value: tagObject.get(tagAttribute) as string
                }));
                this.setState({ tags: tagData.map(tag => tag.value) });
            },
            error: error =>
                window.mx.ui.error(`An error occurred while retrieving tags via XPath (${tagEntity}): ${error}`),
            xpath: XPath
        });
    }

    private createTag(tag: string) {
        const { afterCreateMicroflow, tagAttribute, tagEntity } = this.props;
        mx.data.create({
            callback: object => {
                object.set(tagAttribute, tag);
                mx.data.commit({
                    callback: () => {
                        if (afterCreateMicroflow) {
                            this.executeAction(afterCreateMicroflow, object.getGuid());
                        }
                    },
                    error: error => window.mx.ui.error("Error occurred attempting to commit: " + error),
                    mxobj: object
                });
            },
            entity: tagEntity,
            error: error => window.mx.ui.error(`Error creating tag object ${tagEntity}, ${error.message}`)
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
