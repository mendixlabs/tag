import { Component, createElement } from "react";

import * as Autosuggest from "react-autosuggest";

export interface Suggestion {
    highlightedSuggestion?: string;
    method: string;
    name: string;
    newValue: string;
    suggestionValue: string;
    value: string;
}

export interface SuggestionProperties {
    query: string;
    isHighlighted: boolean;
}

export interface AutoCompleteProps {
    addTag: (tag: string) => void;
    inputPlaceholder: string;
    lazyLoad?: boolean;
    fetchSuggestions?: () => void;
    suggestionValue?: string;
    suggestions: Suggestion[];
}

interface AutoCompleteState {
    lazyLoaded: boolean;
    newValue: string;
    suggestions: Suggestion[];
    suggestionsLazyLoaded: Suggestion[];
    value: string;
}

export class AutoComplete extends Component<AutoCompleteProps, AutoCompleteState> {

    constructor(props: AutoCompleteProps) {
        super(props);

        this.state = {
            lazyLoaded: false,
            newValue: "",
            suggestions: [],
            suggestionsLazyLoaded: [],
            value: ""
        };
        this.getSuggestions = this.getSuggestions.bind(this);
        this.getSuggestionValue = this.getSuggestionValue.bind(this);
        this.renderSuggestion = this.renderSuggestion.bind(this);
        this.hundleOnChange = this.hundleOnChange.bind(this);
        this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
        this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
        this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
        this.hundleOnblur = this.hundleOnblur.bind(this);
    }

    render() {
        const { value, suggestions } = this.state;
        const inputProps = {
            onBlur: this.hundleOnblur,
            onChange: this.hundleOnChange,
            placeholder: this.props.inputPlaceholder,
            type: "search",
            value
        };

        return createElement(Autosuggest, {
            getSuggestionValue: this.getSuggestionValue,
            inputProps,
            onSuggestionSelected: this.onSuggestionSelected,
            onSuggestionsClearRequested: this.onSuggestionsClearRequested,
            onSuggestionsFetchRequested: this.onSuggestionsFetchRequested,
            renderSuggestion: this.renderSuggestion,
            suggestions
        });
    }

    componentWillReceiveProps(newProps: AutoCompleteProps) {
        this.setState({
            lazyLoaded: true,
            suggestions: newProps.suggestions
        });
    }

    // Calculate suggestions from the input value.
    private getSuggestions(suggestion: Suggestion) {
        const inputValue = suggestion.value.trim().toLowerCase();
        const inputLength = inputValue.length;

        return inputLength === 0 ? [] : this.props.suggestions.filter(suggest =>
            suggest.name.toLowerCase().slice(0, inputLength) === inputValue
        );
    }

    // When suggestion is clicked, Autosuggest needs to populate the input
    // based on the clicked suggestion. Teach Autosuggest how to calculate the
    // input value for every given suggestion.
    private getSuggestionValue(suggestion: Suggestion) {
        return suggestion.name;
    }

    private renderSuggestion(suggestion: Suggestion, properties: SuggestionProperties) {
        properties.isHighlighted = true;

        return createElement("span", {
            className: ""
        }, suggestion.name);
    }

    private hundleOnChange(event: Event, inputObject: Suggestion) {
        // Lazyload suggestions
        if (inputObject.method === "enter") {
            event.preventDefault();
        } else {
            this.setState({ value: inputObject.newValue });
        }
    }

    private onSuggestionSelected(_event: Event, suggestion: Suggestion) {
        this.props.addTag(suggestion.suggestionValue);
        this.setState({ value: "" });
    }

    // Call this function every time you need to update suggestions in state.
    private onSuggestionsFetchRequested(suggestion: Suggestion) {
        this.setState({ suggestions: this.getSuggestions(suggestion) });
    }

    private onSuggestionsClearRequested() {
        this.setState({ suggestions: this.props.suggestions });
    }

    // Suggestion that was highlighted just before the input lost focus
    private hundleOnblur(event: Event, suggestion: Suggestion) {
        // Activate lazyloading if suggestions are set to lazyload
        const tagInput = event.target as HTMLElement;

        tagInput.classList.remove("react-autosuggest__input--focused");
        tagInput.classList.remove("mx-focus");

        if (suggestion.highlightedSuggestion) {
            this.props.addTag(suggestion.highlightedSuggestion);
            this.setState({ value: "" });
        }
    }
}
