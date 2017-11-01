import { Component, createElement } from "react";

import * as Autosuggest from "react-autosuggest";

export interface Suggestion {
    name: string;
    newValue: string;
    suggestionValue: string;
    value: string;
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
    suggestions: Suggestion[];
    value: string;
}

export class AutoComplete extends Component<AutoCompleteProps, AutoCompleteState> {

    constructor(props: AutoCompleteProps) {
        super(props);

        this.state = {
            lazyLoaded: false,
            suggestions: [],
            value: ""
        };
        this.hundleKeyDown = this.hundleKeyDown.bind(this);
        this.onChange = this.onChange.bind(this);
        this.getSuggestions = this.getSuggestions.bind(this);
        this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
        this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
        this.getSuggestionValue = this.getSuggestionValue.bind(this);
        this.getSuggestions = this.getSuggestions.bind(this);
        this.renderSuggestion = this.renderSuggestion.bind(this);
        this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
    }

    render() {
        const { value, suggestions } = this.state;

        const inputProps = {
            onChange: this.onChange,
            placeholder: this.props.inputPlaceholder,
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

    componentDidMount() {
        const suggestiInput = document.getElementsByClassName("react-autosuggest__input")[0];
        if (suggestiInput !== undefined && suggestiInput !== null) {
            document.getElementsByClassName("react-tagsinput")[0].addEventListener("focus", this.hundleFocus);
            document.getElementsByClassName("react-tagsinput")[0].addEventListener("blur", this.hundleBlur);
            suggestiInput.addEventListener("focus", this.hundleFocus);
            suggestiInput.addEventListener("blur", this.hundleBlur);
            suggestiInput.addEventListener("keydown", this.hundleKeyDown);
        }
    }

    componentWillReceiveProps(newProps: AutoCompleteProps) {
        this.setState({
            lazyLoaded: true,
            suggestions: newProps.suggestions
        });
    }

    componentWillUnmount() {
        document.getElementsByClassName("react-tagsinput")[0].removeEventListener("blur");
        document.getElementsByClassName("react-tagsinput")[0].removeEventListener("focus");
        document.getElementsByClassName("react-autosuggest__input")[0].removeEventListener("focus");
        document.getElementsByClassName("react-autosuggest__input")[0].removeEventListener("keydown");
        document.getElementsByClassName("react-autosuggest__input")[0].removeEventListener("blur");
    }

    private onSuggestionSelected(_event: Event, suggestion: Suggestion) {
        this.props.addTag(suggestion.suggestionValue);
        this.setState({ value: "" });
    }

    private setUpSuggestions(props: AutoCompleteProps) {
        if (props.fetchSuggestions && props.lazyLoad) {
            props.fetchSuggestions();
        }
    }

    private getSuggestions(suggestion: Suggestion) {
        const inputValue = suggestion.value.trim().toLowerCase();
        const inputLength = inputValue.length;

        this.setState({ lazyLoaded: true });
        return inputLength === 0 ? [] : this.props.suggestions.filter(suggest =>
            suggest.name.toLowerCase().slice(0, inputLength) === inputValue
        );
    }

    private getSuggestionValue(suggestion: Suggestion) {
        return suggestion.name;
    }

    private renderSuggestion(suggestion: Suggestion) {
        return createElement("div", {
            className: ""
        }, suggestion.name);
    }

    private onChange(_event: Event, inputObject: Suggestion) {
        this.setState({ value: inputObject.newValue });
    }

    private onSuggestionsFetchRequested(suggestion: Suggestion) {
        this.setState({ suggestions: this.getSuggestions(suggestion) });
    }

    private onSuggestionsClearRequested() {
        this.setState({ suggestions: this.props.suggestions });
    }

    private hundleFocus() {
        const tagInput = "react-tagsinput--focused";
        const suggestInput = "react-autosuggest__input--focused";
        const input = document.getElementsByClassName("react-tagsinput")[0];
        const input2 = document.getElementsByClassName("react-autosuggest__input")[0];
        input.classList.add(tagInput);
        input2.classList.add(suggestInput);
    }

    private hundleKeyDown() {
        setTimeout(() => {
            this.setUpSuggestions(this.props);
            this.setState({ lazyLoaded: true
            });
        }, 1000);
    }

    private hundleBlur() {
        const input = document.getElementsByClassName("react-tagsinput")[0];
        const input2 = document.getElementsByClassName("react-autosuggest__input")[0];
        input.classList.remove("react-tagsinput--focused");
        input2.classList.remove("react-autosuggest__input--focused");
    }
}
