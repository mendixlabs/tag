import { Component, createElement } from "react";

import * as TagsInput from "react-tagsinput";
import { AutoComplete } from "./AutoComplete";
import { Alert } from "./Alert";
import { processSuggestions } from "../utils/Utilities";

import * as classNames from "classnames";

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
    readOnly?: boolean;
    showError: (message: string) => void;
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
        this.renderAutosuggest = this.renderAutosuggest.bind(this);
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
                disabled: this.props.readOnly,
                inputProps,
                inputValue: this.state.newTag,
                onChangeInput: this.handleChangeInput,
                maxTags: this.props.tagLimit === 0 ? undefined : this.props.tagLimit,
                onChange: this.handleChange,
                renderInput: this.props.enableSuggestions ? this.renderAutosuggest : undefined,
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
        const tagNodelist = document.querySelectorAll(".react-tagsinput-input");

        this.addEvents(tagNodelist);
    }

    componentWillReceiveProps(newProps: TagProps) {
        this.setState({
            alertMessage: newProps.alertMessage,
            tagList: newProps.tagList
        });
    }

    componentWillUnmount() {
        const nodeList = document.querySelectorAll(".react-tagsinput");

        for (let i = 0; nodeList[i]; i++) {
            nodeList[i].removeEventListener("focus");
        }
    }

    private addEvents(nodes: NodeListOf<Element>) {
        for (let i = 0; nodes[i]; i++) {
            const node = nodes[i] as HTMLElement;

            node.addEventListener("focus", this.hundleFocus);
            node.addEventListener("blur", this.hundleOnblur);
        }
    }

    private handleChangeInput(newTag: string) {
        const { tagLimit, tagLimitMessage, showError } = this.props;

        if (tagLimit === 0) {
            this.setState({ newTag });
        } else if (this.state.tagList.length >= tagLimit) {
            showError(tagLimitMessage.replace("{limit}", `${tagLimit}`));
            this.setState({ newTag });
        } else {
            this.setState({ newTag });
        }
    }

    private renderAutosuggest() {
        return createElement(AutoComplete, {
            addTag: (tag: string) => this.processTag(tag),
            fetchSuggestions: this.props.fetchSuggestions,
            inputPlaceholder: this.props.inputPlaceholder,
            lazyLoad: this.props.lazyLoad,
            suggestions: processSuggestions(this.props.suggestions)
        });
    }

    private processTag(tag: string) {
        const { tagLimit, tagLimitMessage, createTag } = this.props;
        const tagList = this.state.tagList;

        if (tagLimit === 0 || tagLimit + 1 > this.state.tagList.length) {
            // Validate tag if its not a duplicate.
            if (this.validateTagInput(tag, this.state.tagList)) {
                this.setState ({
                    alertMessage: `Duplicate ${tag}`,
                    newTag: tag
                });
            } else if (createTag) {
                tagList.push(tag);
                this.setState({ tagList });
                createTag(tag);
            }
        } else {
            this.props.showError(tagLimitMessage.replace("{limit}", `${tagLimit}`));
        }
    }

    private validateTagInput = (newTag: string, availableTags: string[]): boolean => {
        let valid = false;
        for (const tagValue of availableTags) {
            if (tagValue.localeCompare(newTag) === 0) {
                valid = true;
                break;
            }
        }

        return valid;
    }

    private handleChange(tagList: string[], changed: string[]) {
        if (this.props.onRemove && this.state.tagList.length > tagList.length) {
            this.props.onRemove(changed[0]);
            this.setState({ tagList });
        } else {
            this.processTag(changed[0]);
        }
    }

    private hundleFocus(event: Event) {
        const tagInput = event.target as HTMLElement;
        const tagSpan = tagInput.parentElement as HTMLElement;
        const tagContainer = tagSpan.parentElement as HTMLElement;

        tagContainer.classList.add("form-control");
    }

    private hundleOnblur(event: Event) {
        const tagInput = event.target as HTMLElement;
        const tagSpan = tagInput.parentElement as HTMLElement;
        const tagContainer = tagSpan.parentElement as HTMLElement;

        tagContainer.classList.add("form-control");
        tagContainer.classList.remove("react-tagsinput--focused");
    }
}
