import { shallow } from "enzyme";
import { createElement } from "react";

import * as Autosuggest from "react-autosuggest";

import { AutoComplete, AutoCompleteProps } from "../AutoComplete";

describe("AutoComplete", () => {
    const renderAutoComplete = (props: AutoCompleteProps) => shallow(createElement(AutoComplete, props));
    const defaultProps: AutoCompleteProps = {
        addTag: () => jasmine.any(Function),
        inputPlaceholder: "",
        lazyLoad: false,
        suggestions: [ ]
    };

    it("renders the structure correctly", () => {
        const autoComplete = renderAutoComplete(defaultProps);

        expect(autoComplete).toBeElement(
            createElement(Autosuggest, {
                getSuggestionValue: jasmine.any(Function),
                inputProps: jasmine.any(Object),
                onSuggestionSelected: jasmine.any(Function),
                onSuggestionsClearRequested: jasmine.any(Function),
                onSuggestionsFetchRequested: jasmine.any(Function),
                renderSuggestion: jasmine.any(Function),
                suggestions: []
            })
        );
    });

    it("fetches suggestions when value is specified", () => {
        const suggestion = {
            name: "testValue",
            newValue: "testValue",
            suggestionValue: "testValue",
            value: "testValue",
            method: ""
        };
        const autoComplete = renderAutoComplete(defaultProps);
        const autoCompleteInstance = autoComplete.instance() as any;

        autoCompleteInstance.onSuggestionsFetchRequested(suggestion);
        autoCompleteInstance.getSuggestions(suggestion);
        autoCompleteInstance.onSuggestionSelected(jasmine.any(Event), suggestion);

        expect(autoComplete.state().value).toEqual("");
    });

    it("clears the suggestions when there is no value specified", () => {
        const autoComplete = renderAutoComplete(defaultProps);
        const autoCompleteInstance = autoComplete.instance() as any;
        autoCompleteInstance.onSuggestionsClearRequested();

        expect(autoComplete.state().suggestions).toEqual([]);
    });

    xit("should lazyload suggestion when lazyloading is set to true", () => {
        const newProps: AutoCompleteProps = {
            ...defaultProps,
            fetchSuggestions: () => jasmine.any(Function) as any,
            lazyLoad: true
        };
        const suggestions = {
            name: "Canada", value: "Canada", newValue: "Uganda",
            suggestionValue: "C", method: "type"
        };
        const autoComplete = renderAutoComplete(newProps);
        const autoCompleteInstance = autoComplete.instance() as any;
        const fetchSuggestionSpy = spyOn(autoCompleteInstance, "fetchSuggestions").and.callThrough();

        autoCompleteInstance.onSuggestionsFetchRequested(suggestions);
        autoCompleteInstance.renderSuggestion(newProps);
        autoCompleteInstance.getSuggestionValue(suggestions);
        const suggestionList = autoComplete.find(".react-autosuggest__suggestions-list");

        expect(suggestionList.length).toBeGreaterThan(0);
        setTimeout(() => {
            expect(fetchSuggestionSpy).toHaveBeenCalled();
        }, 1000);
    });

    it("adds a new tag while from selected suggestion", () => {
        const suggestions = {
            name: "Canada", value: "Canada", newValue: "Uganda",
            suggestionValue: "U", method: "type"
        };
        spyOn(defaultProps, "addTag").and.callThrough();

        const autoComplete = renderAutoComplete(defaultProps);
        const autoCompleteInstance = autoComplete.instance() as any;
        autoCompleteInstance.onSuggestionSelected(jasmine.any(Event), suggestions);

        expect(defaultProps.addTag).toHaveBeenCalledTimes(1);
    });
});
