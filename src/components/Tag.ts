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
    onRemove?: (tagName: string) => void;
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
                addOnPaste: true,
                disabled: this.props.readOnly,
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

    componentWillReceiveProps(newProps: TagProps) {
        this.setState({
            tags: newProps.tags.slice(0, 2)
        });
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
        const { enableCreate, tagLimit, tagLimitMessage, createTag, showError } = this.props;
        if (tagLimit === 0 || tagLimit > (this.state.tags).length) {
            this.state.tags.push(tag);
            this.setState({ tags: this.state.tags });
            if (enableCreate && createTag && tag !== " ") {
                createTag(tag);
            }
        } else {
            showError(tagLimitMessage.replace("{limit}", `${tagLimit}`));
        }
    }

    private handleChange(tags: string[], changed: string[]) {
        const { onRemove } = this.props;
        if (onRemove && this.state.tags.length > tags.length) {
            onRemove(changed[0]);
            this.setState({ tags });
        } else {
            this.addTag(changed[0]);
        }
    }
}
