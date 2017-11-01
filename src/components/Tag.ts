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
    enableSuggestions?: boolean;
    onRemove?: (tag: string) => void;
    inputPlaceholder: string;
    lazyLoad?: boolean;
    lazyLoadTags?: () => void;
    newTag: string;
    readOnly?: boolean;
    showError: (message: string) => void;
    style?: object;
    suggestions?: string[];
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
        this.autosuggest = this.autosuggest.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleChangeInput = this.handleChangeInput.bind(this);
        this.getSuggestions = this.getSuggestions.bind(this);
    }

    render() {
        const inputProps = {
            className: "react-tagsinput-input",
            placeholder: !this.props.readOnly ? this.props.inputPlaceholder : " "
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
                inputValue: this.state.newTag,
                onChangeInput: this.handleChangeInput,
                onlyUnique: true,
                maxTags: this.props.tagLimit === 0 ? undefined : this.props.tagLimit,
                onChange: this.handleChange,
                renderInput: this.props.enableSuggestions ? this.autosuggest : undefined,
                value: this.state.tagList
            }),
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-tag-alert",
                message: this.state.alertMessage
            })
        );
    }

    componentWillReceiveProps(newProps: TagProps) {
        if (newProps.tagList !== this.props.tagList) {
            this.setState({ tagList: newProps.tagList });
        }
    }

    private handleChangeInput(newTag: string) {
        const { tagLimit, tagLimitMessage, showError } = this.props;
        if (tagLimit === 0) {
            this.setState({ newTag });
        } else if (this.state.tagList.length >= tagLimit) {
            showError(tagLimitMessage.replace("{limit}", `${tagLimit}`));
            this.setState({ newTag: "" });
        } else {
            this.setState({ newTag });
        }
    }

    private getSuggestions(): Suggestion[] {
        if (this.props.suggestions) {
            const suggestions: Suggestion[] = this.props.suggestions.map(suggestion => ({
                name: suggestion,
                newValue: "",
                suggestionValue: "",
                value: ""
            }));

            return suggestions;
        }
        return [];
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
        const { tagList, tagLimit, tagLimitMessage, createTag } = this.props;
        if (tagLimit === 0 || tagLimit + 1 > this.state.tagList.length) {
            if (createTag && tagList.indexOf(tag) === -1 && this.state.tagList.indexOf(tag) === -1) {
                createTag(tag);
            }
            this.state.tagList.push(tag);
            this.setState({ tagList: this.state.tagList });
        } else {
            this.props.showError(tagLimitMessage.replace("{limit}", `${tagLimit}`));
        }
    }

    private handleChange(tagList: string[], changed: string[]) {
        if (this.props.onRemove && this.state.tagList.length > tagList.length) {
            this.props.onRemove(changed[0]);
            this.setState({ tagList });
        } else {
            this.addTag(changed[0]);
        }
    }
}
