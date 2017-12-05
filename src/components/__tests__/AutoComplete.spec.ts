import { shallow } from "enzyme";
import { createElement } from "react";

import * as Autosuggest from "react-autosuggest";

import { AutoComplete, AutoCompleteProps } from "../AutoComplete";

describe("AutoComplete", () => {
    const renderAutoComplete = (props: AutoCompleteProps) => shallow(createElement(AutoComplete, props));
    const defaultProps: AutoCompleteProps = {
        addTag: () => { /* */ },
        inputPlaceholder: "",
        lazyLoad: false,
        suggestions: []
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

    it("fetches the suggestions when value is specified", () => {
        const suggestion = {
            name: "Uganda",
            newValue: "Netherlands",
            suggestionValue: "Uganda",
            value: "Uganda",
            method: "enter"
        };
        const autoComplete = renderAutoComplete(defaultProps);

        const autoCompleteInstance = autoComplete.instance() as any;
        autoCompleteInstance.onSuggestionsFetchRequested(suggestion);
        autoCompleteInstance.getSuggestions(suggestion);
        autoCompleteInstance.onSuggestionSelected(jasmine.any(Event), suggestion);

        expect(autoComplete.state().value).toEqual("");
    });

    it("renders the fetched suggestions", () => {
        const autoComplete = renderAutoComplete(defaultProps);

        const autoCompleteInstance = autoComplete.instance() as any;
        autoCompleteInstance.getSuggestionValue(defaultProps.suggestions);
        autoCompleteInstance.renderSuggestion({
            name: "",
            value: ""
        });
    });

    it("updates the suggestions", () => {
        const newProps: AutoCompleteProps = {
            addTag: jasmine.any(Function),
            inputPlaceholder:  "",
            lazyLoad: false,
            suggestions: [ {
                    name: "Canada", value: "Canada", newValue: "Uganda", suggestionValue: "U", method: "enter"
                } ]
        };
        const autoComplete = renderAutoComplete(defaultProps);

        const autoCompleteInstance = autoComplete.instance() as any;
        autoComplete.setState({ suggestions: newProps.suggestions });
        autoCompleteInstance.getSuggestions(newProps.suggestions[0]);
        autoCompleteInstance.componentDidMount();
        autoCompleteInstance.componentWillReceiveProps(newProps);
        autoCompleteInstance.hundleOnChange(jasmine.any(Event), newProps.suggestions[0]);

        expect(autoComplete.state().suggestions.length).toEqual(1);
    });

    it("clears the suggestions when there is no value specified", () => {
        const autoComplete = renderAutoComplete(defaultProps);

        const autoCompleteInstance = autoComplete.instance() as any;
        autoCompleteInstance.onSuggestionsClearRequested();

        expect(autoComplete.state().suggestions).toEqual([]);
    });
});
