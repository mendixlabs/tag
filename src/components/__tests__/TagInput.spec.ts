import { ShallowWrapper, shallow } from "enzyme";
import { createElement } from "react";
import * as TagsInput from "react-tagsinput";

import { Tag, TagProps } from "../Tag";
import { Alert } from "../Alert";
import * as classNames from "classnames";

describe("TagInput", () => {
    // let tagStyle: BootstrapStyle;
    const currentTags = [ "Uganda" ];
    const changedTags = [ "Uganda", "Kenya", "Netherland" ];
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
        newTag: ""
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
                    `widget-tag-primary`,
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
            newTag: ""
        };
        tagInput = renderTag(newProps);
        const newTagState = [ "Uganda", "Kenya" ];
        tagInput.setState({ tagList: newTagState });

        expect(tagInput.state().tagList.length).toBe(2);
    });

    it("updates tags when they have been added", () => {
        const newProps: TagProps = {
            inputPlaceholder:  "",
            showError: jasmine.any(Function) as any,
            lazyLoad: false,
            tagLimit: 5,
            tagLimitMessage: "",
            tagList: [ "Uganda" ],
            newTag: "Kenya"
        };
        tagInput = renderTag(newProps);

        const tagInstance = tagInput.instance() as any;
        tagInstance.handleChangeInput(newProps.newTag);
        tagInstance.handleChange(changedTags, currentTags);
        tagInstance.addTag("Netherland");

        expect(tagInput.state().tagList.length).toBe(3);
    });

    it("renders no tags when they are not specified", () => {
        const newProps: TagProps = {
            inputPlaceholder:  "",
            showError: jasmine.any(Function) as any,
            lazyLoad: false,
            tagLimit: 5,
            tagLimitMessage: "",
            tagList: [ ],
            newTag: ""
        };
        tagInput = renderTag(newProps);

        const tagInstance = tagInput.instance() as any;
        tagInstance.autosuggest();

        expect(tagInput.state().tagList).toEqual([]);
    });

    it("adds no tags when tag limit is reached", () => {
        const value = "Netherland";
        const newProps: TagProps = {
            inputPlaceholder:  "",
            showError: () => undefined,
            createTag: jasmine.any(Function) as any,
            lazyLoad: false,
            tagLimit: 2,
            tagLimitMessage: "",
            tagList: [ "Uganda", "Kenya" ],
            newTag: ""
        };
        tagInput = renderTag(newProps);

        const tagInstance = tagInput.instance() as any;
        tagInstance.handleChangeInput(value);

        expect(tagInput.state().tagList.length).toBe(2);
    });
});
