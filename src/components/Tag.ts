import { Component, createElement } from "react";
import * as ReactDOM from "react-dom";
import * as classNames from "classnames";

import { Alert } from "./Alert";
import * as TagsInput from "react-tagsinput";
import { AutoComplete } from "./AutoComplete";

import { processSuggestions } from "../utils/Utilities";

import "react-tagsinput/react-tagsinput.css";
import "../ui/Tag.scss";

export interface TagProps {
    alertMessage?: string;
    tagStyle?: BootstrapStyle;
    className?: string;
    createTag?: (tag: string) => void;
    enableSuggestions?: boolean;
    fetchSuggestions?: () => void;
    onRemove?: (tag: string) => void;
    inputPlaceholder: string;
    lazyLoad?: boolean;
    newTag: string;
    readOnly: boolean;
    style?: object;
    suggestions: string[];
    tagLimit: number;
    tagLimitMessage: string;
    tagList: string[];
}

interface TagState {
    alertMessage?: string;
    newTag: string;
    tagList: string[];
}

export type BootstrapStyle = "primary" | "inverse" | "success" | "info" | "warning" | "danger";

export class Tag extends Component<TagProps, TagState> {

    constructor(props: TagProps) {
        super(props);

        this.state = {
            alertMessage: props.alertMessage,
            newTag: this.props.newTag,
            tagList: props.tagList
        };

        this.renderAutoComplete = this.renderAutoComplete.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleChangeInput = this.handleChangeInput.bind(this);
    }

    render() {
        const inputProps = {
            className: "react-tagsinput-input",
            placeholder: this.props.readOnly ? " " : this.props.inputPlaceholder
        };
        return createElement("div",
            {
                className: classNames("widget-tag", `widget-tag-${this.props.tagStyle}`, this.props.className),
                style: this.props.style
            },
            createElement(TagsInput, {
                addOnBlur: true,
                addOnPaste: true,
                className: this.props.readOnly ? "tag-container-readOnly" : "tag-container",
                disabled: this.props.readOnly,
                inputProps,
                inputValue: this.state.newTag,
                onChangeInput: this.handleChangeInput,
                onChange: this.handleChange,
                renderInput: this.props.enableSuggestions ? this.renderAutoComplete : undefined,
                value: this.state.tagList
            }),
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-tag-alert",
                message: this.state.alertMessage
            })
        );
    }

    componentDidMount() {
        const node = ReactDOM.findDOMNode(this);
        const tagInputSelector = node.querySelectorAll(".react-tagsinput-input");

        this.addEvents(tagInputSelector);
    }

    componentWillReceiveProps(newProps: TagProps) {
        if (newProps.tagLimit > 0 && newProps.tagList.length > newProps.tagLimit) {
            this.setState({
                alertMessage: newProps.tagLimitMessage.replace("{limit}", `${newProps.tagLimit}`),
                tagList: newProps.tagList
            });
        } else {
            this.setState({
                alertMessage: newProps.alertMessage,
                tagList: newProps.tagList
            });
        }
    }

    componentWillUnmount() {
        const node = ReactDOM.findDOMNode(this);
        const inputNodeList = node.querySelectorAll(".react-tagsinput-input");

        for (let i = 0; inputNodeList[i]; i++) {
            inputNodeList[i].removeEventListener("focus", this.handleFocus, true);
            inputNodeList[i].removeEventListener("blur", this.handleOnblur, true);
        }
    }

    private renderAutoComplete() {
        return createElement(AutoComplete, {
            addTag: (tag: string) => this.processTag(tag),
            fetchSuggestions: this.props.fetchSuggestions,
            inputPlaceholder: this.props.inputPlaceholder,
            readOnly: this.props.readOnly,
            lazyLoad: this.props.lazyLoad,
            onRemove: this.props.onRemove,
            suggestions: processSuggestions(this.props.suggestions, this.props.tagList),
            tagList: this.state.tagList
        });
    }

    private handleChangeInput(newTag: string) {
        this.setState({ newTag });
    }

    private handleChange(tagList: string[], changed: string[]) {
        if (this.props.onRemove && this.state.tagList.length > tagList.length) {
            this.props.onRemove(changed[0]);
            this.setState({
                alertMessage: "",
                tagList
            });
        } else { this.processTag(changed[0]); }
    }

    private processTag(newTag: string) {
        const { tagLimit, tagLimitMessage, createTag } = this.props;

        if (tagLimit === 0 || this.state.tagList.length < tagLimit) {
            // Validate tag if its not a duplicate.
            if (this.validateTagInput(newTag, this.state.tagList)) {
                this.setState ({
                    alertMessage: `Duplicate ${newTag}`,
                    newTag
                });
            } else if (createTag) {
                this.setState({
                    alertMessage: ""
                });
                createTag(newTag);
            }
        } else {
            this.setState ({ alertMessage: tagLimitMessage.replace("{limit}", `${tagLimit}`) });
        }
    }

    private validateTagInput = (newTag: string, existingTags: string[]): boolean => {
        let valid = false;

        for (const tagValue of existingTags) {
            if (tagValue.localeCompare(newTag) === 0) {
                valid = true;
                break;
            }
        }

        return valid;
    }

    private addEvents(nodes: NodeListOf<Element>) {
        for (let i = 0; nodes[i]; i++) {
            const node = nodes[i] as HTMLElement;

            node.addEventListener("focus", this.handleFocus, true);
            node.addEventListener("blur", this.handleOnblur, true);
        }
    }

    private handleFocus(event: Event) {
        const tagInput = event.target as HTMLElement;
        const tagSpan = tagInput.parentElement as HTMLElement;
        const tagContainer = tagSpan.parentElement as HTMLElement;

        tagContainer.classList.add("form-control");
    }

    private handleOnblur(event: Event) {
        const tagInput = event.target as HTMLElement;
        const tagSpan = tagInput.parentElement as HTMLElement;
        const tagContainer = tagSpan.parentElement as HTMLElement;

        tagContainer.classList.add("form-control");
        tagContainer.classList.remove("react-tagsinput--focused");
    }
}
