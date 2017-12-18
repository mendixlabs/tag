import { ShallowWrapper, mount, shallow } from "enzyme";
import { createElement } from "react";
import * as TagsInput from "react-tagsinput";

import { Tag, TagProps } from "../Tag";
import { Alert } from "../Alert";
import * as classNames from "classnames";

describe("TagsInput", () => {
    const currentTags = [ "example1" ];
    const shallowRenderTag = (props: TagProps) => shallow(createElement(Tag, props));
    const fullRenderTag = (props: TagProps) => mount(createElement(Tag, props));

    let tagInput: ShallowWrapper<TagProps, any>;
    const defaultProps: TagProps = {
        className: "",
        enableSuggestions: false,
        inputPlaceholder:  "",
        showError: jasmine.any(Function) as any,
        lazyLoad: false,
        style: undefined,
        tagLimit: 5,
        tagLimitMessage: "",
        tagList: currentTags,
        tagStyle: "primary",
        newTag: "",
        suggestions: [ "Suggestion1", "Suggestion2" ]
    };

    const inputProps = {
        className: "react-tagsinput-input",
        placeholder: ""
    };

    it("renders TagInput structure correctly", () => {
        const tag = shallowRenderTag(defaultProps);

        expect(tag).toBeElement(
            createElement("div", {
                className: classNames(
                    "widget-tag",
                    `widget-tag-${defaultProps.tagStyle}`,
                    defaultProps.className
                ),
                style: defaultProps.style
            }, createElement(TagsInput, {
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
                    className: "widget-tag-alert",
                    message: ""
                })
            ));
    });

    it("should allow tag input via the tag text input", () => {
        const newValue = "foo";
        const newProps: TagProps = {
            ...defaultProps,
            tagList: []
        };
        tagInput = shallowRenderTag(newProps);
        const tagInstance = tagInput.instance() as any;
        const addEventSpy = spyOn(tagInstance, "addEvents").and.callThrough();
        const tagNodelist = document.querySelectorAll(".react-tagsinput-input");

        tagInstance.componentDidMount();
        tagInstance.handleChangeInput(newValue);
        tagInstance.componentWillUnmount();

        expect(tagInput.state().newTag).toEqual(newValue);
        expect(addEventSpy).toHaveBeenCalledWith(tagNodelist);
    });

    it("should render autoSuggest component if suggestions are enabled", () => {
        const newProps: TagProps = {
            ...defaultProps,
            tagList: [ "baa" ],
            tagLimit: 0,
            newTag: "foo"
        };
        const tag = fullRenderTag(newProps);
        const tagInstance = tag.instance() as any;
        const renderSuggestionSpy = spyOn(tagInstance, "renderAutosuggest").and.callThrough();

        tag.setProps({ enableSuggestions: true });
        tagInstance.componentDidMount();

        expect(renderSuggestionSpy).toHaveBeenCalled();
    });

    it("should process a tag before it is added", () => {
        const newProps: TagProps = {
            ...defaultProps,
            onRemove: () => jasmine.any(Function) as any
        };

        const tag = fullRenderTag(newProps);
        const tagInstance = tag.instance() as any;
        const changeSpy = spyOn(tagInstance, "handleChange").and.callThrough();
        const processTagSpy = spyOn(tagInstance, "processTag").and.callThrough();

        tag.find("input").simulate("change", { target: { value: "foo" } });
        tag.find("input").simulate("blur");

        expect(changeSpy).toHaveBeenCalledTimes(1);
        expect(processTagSpy).toHaveBeenCalledTimes(1);
    });
});
