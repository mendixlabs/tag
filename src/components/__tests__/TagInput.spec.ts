import { ShallowWrapper, shallow } from "enzyme";
import { createElement } from "react";
import * as TagsInput from "react-tagsinput";

import { Tag, TagProps } from "../Tag";
import { Alert } from "../Alert";
import * as classNames from "classnames";

describe("TagInput", () => {
    // let tagStyle: BootstrapStyle;
    const currentTags = [ "Uganda" ];
    const renderTag = (props: TagProps) => shallow(createElement(Tag, props));
    let tagInput: ShallowWrapper<TagProps, any>;
    const defaultProps: TagProps = {
        className: "",
        enableSuggestions: true,
        inputPlaceholder:  "",
        showError: jasmine.any(Function) as any,
        lazyLoad: false,
        style: undefined,
        tagLimit: 5,
        tagLimitMessage: "",
        tagList: [ "Uganda" ],
        tagStyle: undefined,
        newTag: "",
        suggestions: [ "Suggestion1", "Suggestion2" ]
    };

    const inputProps = {
        className: "react-tagsinput-input",
        placeholder: ""
    };

    it("renders TagInput structure correctly", () => {
        const tag = renderTag(defaultProps);

        expect(tag).toBeElement(
            createElement("div", {
                className: classNames(
                    "widget-tag",
                    `widget-tag-${defaultProps.tagStyle}`,
                    defaultProps.className
                ),
                style: defaultProps.style
            },
                createElement(TagsInput, {
                    addOnBlur: true,
                    addOnPaste: true,
                    disabled: false,
                    inputProps,
                    inputValue: "",
                    maxTags: 5,
                    onChangeInput: jasmine.any(Function) as any,
                    onChange: jasmine.any(Function) as any,
                    renderInput: jasmine.any(Function) as any,
                    value: currentTags
                }),
                createElement(Alert, {
                    bootstrapStyle: "danger",
                    className: "widget-tag-alert"
                })
            ));
    });

    it("updates tags when they are removed", () => {
        const newProps: TagProps = {
            inputPlaceholder:  "",
            showError: jasmine.any(Function) as any,
            lazyLoad: false,
            tagLimit: 5,
            tagLimitMessage: "",
            tagList: [ "Uganda", "Kenya", "Netherland" ],
            newTag: "",
            suggestions: [ "Suggestion1", "Suggestion2" ]
        };
        tagInput = renderTag(newProps);
        const newTagState = [ "Uganda", "Kenya" ];
        tagInput.setState({ tagList: newTagState });

        expect(tagInput.state().tagList.length).toBe(2);
    });

    it("updates tags when one has been added", () => {
        const newProps: TagProps = {
            inputPlaceholder:  "",
            showError: jasmine.any(Function) as any,
            lazyLoad: false,
            tagLimit: 5,
            tagLimitMessage: "",
            tagList: [ "Uganda" ],
            newTag: "SampleTag",
            suggestions: [ "Suggestion1", "Suggestion2" ]
        };
        tagInput = renderTag(defaultProps);

        const tagInstance = tagInput.instance() as any;
        tagInstance.handleChangeInput(newProps.newTag);
        tagInstance.addTag("SampleTag");
        tagInstance.componentWillReceiveProps(newProps);

        expect(tagInput.state().tagList.length).toBe(2);
    });

    it("renders no tags when they are not specified", () => {
        const newProps: TagProps = {
            inputPlaceholder:  "",
            showError: jasmine.any(Function) as any,
            lazyLoad: false,
            tagLimit: 5,
            tagLimitMessage: "",
            tagList: [ ],
            newTag: "",
            suggestions: [ "Suggestion1", "Suggestion2" ]
        };
        tagInput = renderTag(newProps);

        const tagInstance = tagInput.instance() as any;
        tagInstance.componentDidMount();
        tagInstance.autosuggest();

        expect(tagInput.state().tagList).toEqual([]);
    });
});
