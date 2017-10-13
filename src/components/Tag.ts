import { Component, createElement } from "react";

import * as TagsInput from "react-tagsinput";
import { AutoComplete, Suggestion } from "./AutoComplete";
import { Alert } from "./Alert";

import * as classNames from "classnames";

import "react-tagsinput/react-tagsinput.css";
import "../ui/Tag.scss";

export interface TagProps {
    alertMessage?: string;
    tagStyle?: BootstrapStyle;
    className?: string;
    createTag?: (tag: string) => void;
    enableCreate?: boolean;
    enableSuggestions?: boolean;
    inputPlaceholder: string;
    lazyLoad?: boolean;
    lazyLoadTags?: () => void;
    readOnly?: boolean;
    showError: (message: string) => void;
    style?: object;
    tagLimit: number;
    tagLimitMessage: string;
    tags: string[];
    tagValue: string;
}

interface TagState {
    alertMessage?: string;
    tag: string;
    tags: string[];
}

export type BootstrapStyle = "primary" | "inverse" | "success" | "info" | "warning" | "danger";

export class Tag extends Component<TagProps, TagState> {
    static defaultProps: TagProps = {
        tags: [],
        inputPlaceholder: "Add a tag",
        showError: () => undefined,
        tagStyle: "primary",
        tagLimit: 0,
        tagLimitMessage: "",
        tagValue: ""
    };
    constructor(props: TagProps) {
        super(props);

        this.state = {
            alertMessage: props.alertMessage,
            tag: this.props.tagValue,
            tags: props.tags
        };
        this.addTag = this.addTag.bind(this);
        this.autosuggest = this.autosuggest.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleChangeInput = this.handleChangeInput.bind(this);
        this.getSuggestions = this.getSuggestions.bind(this);
    }

    render() {
        const inputProps = {
            className: "react-tagsinput-input",
            placeholder: this.props.inputPlaceholder
        };
        return createElement("div",
            {
                className: classNames(
                    "widget-tag",
                    `widget-tag-${this.props.tagStyle}`,
                    this.props.className
                ),
                style: this.props.style
            },
            createElement(TagsInput, {
                addOnBlur: true,
                addOnPaste: true,
                disabled: this.props.readOnly,
                inputProps,
                inputValue: this.state.tag,
                onChangeInput: this.handleChangeInput,
                maxTags: this.props.tagLimit === 0 ? 1000 : this.props.tagLimit,
                onChange: this.handleChange,
                renderInput: this.props.enableSuggestions ? this.autosuggest : undefined,
                value: this.state.tags
            }),
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-tag-alert",
                message: this.state.alertMessage
            })
        );
    }

    private handleChangeInput(tag: string) {
        const { tagLimit, tagLimitMessage, showError } = this.props;
        if (tagLimit === 0) {
            this.setState({ tag });
        } else if (this.state.tags.length >= tagLimit) {
            showError(tagLimitMessage.replace("{limit}", `${tagLimit}`));
            this.setState({ tag: "" });
        } else {
            this.setState({ tag });
        }
    }

    private getSuggestions(): Suggestion[] {
        const suggestions: Suggestion[] = this.props.tags.map(tag => ({
            name: tag,
            newValue: "",
            suggestionValue: "",
            value: ""
        }));

        return suggestions;
    }

    private autosuggest() {
        return createElement(AutoComplete, {
            addTag: (tag: string) => this.addTag(tag),
            fetchSuggestions: this.props.lazyLoadTags,
            inputPlaceholder: this.props.inputPlaceholder,
            lazyLoad: this.props.lazyLoad,
            suggestions: this.getSuggestions()
        });
    }

    private addTag(tag: string) {
        const { enableCreate, tags, tagLimit, tagLimitMessage, createTag } = this.props;
        if (tagLimit === 0 || tagLimit > this.state.tags.length) {
            if (enableCreate && createTag && tags.indexOf(tag) === -1 && this.state.tags.indexOf(tag) === -1) {
                createTag(tag);
            }
            this.state.tags.push(tag);
            this.setState({ tags: this.state.tags });
        } else {
            this.props.showError(tagLimitMessage.replace("{limit}", `${tagLimit}`));
        }
    }

    private handleChange(tags: string[], changed: string[]) {
        if (this.state.tags.length > tags.length) {
            this.setState({ tags });
        } else {
            this.addTag(changed[0]);
        }
    }
}
