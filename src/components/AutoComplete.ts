import { Component, createElement } from "react";

import * as Autosuggest from "react-autosuggest";

export interface Suggestion {
    method: string;
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
    readOnly?: boolean;
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
        this.hundleFocus = this.hundleFocus.bind(this);
        this.hundleEnter = this.hundleEnter.bind(this);
    }

    render() {
        const { value, suggestions } = this.state;
        const inputProps = {
            onBlur: this.hundleOnblur,
            onChange: this.hundleOnChange,
            placeholder: this.props.readOnly ? " " : this.props.inputPlaceholder,
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

    componentDidMount() {
        const suggestionInput = document.querySelectorAll(".react-autosuggest__input");
        this.addEventListener(suggestionInput);
    }

    componentWillReceiveProps(newProps: AutoCompleteProps) {
        this.setState({
            lazyLoaded: true,
            suggestionsLazyLoaded: newProps.suggestions
        });
    }

    componentWillUnmount() {
        const suggestionInput = document.querySelectorAll(".react-autosuggest__input");
        this.removeEventsListeners(suggestionInput);
    }

    private addEventListener(nodes: NodeListOf<Element>) {
        for (let i = 0; nodes[i]; i++) {
            const node = nodes[i] as HTMLElement;

            const suggestionContainer = node.parentNode as HTMLElement;
            const suggestionSpan = suggestionContainer.parentNode as HTMLElement;
            const tagContainer = suggestionSpan.parentNode as HTMLElement;

            tagContainer.addEventListener("focus", this.hundleContainerFocus, false);
            tagContainer.addEventListener("click", this.hundleClick, false);

            node.addEventListener("keydown", this.hundleEnter, false);
            node.addEventListener("focus", this.hundleFocus, false);
        }
    }

    private removeEventsListeners(nodes: NodeListOf<Element>) {
        for (let i = 0; nodes[i]; i++) {
            const node = nodes[i] as HTMLElement;

            const suggestionContainer = node.parentNode as HTMLElement;
            const suggestionSpan = suggestionContainer.parentNode as HTMLElement;
            const tagContainer = suggestionSpan.parentNode as HTMLElement;

            tagContainer.removeEventListener("focus");
            tagContainer.removeEventListener("click");

            node.removeEventListener("keydown");
            node.removeEventListener("focus");
        }
    }

    // Calculate suggestions from the input value.
    private getSuggestions(suggestion: Suggestion) {
        const inputValue = suggestion.value.trim().toLowerCase();
        const inputLength = inputValue.length;
        const { suggestionsLazyLoaded } = this.state;

        if (this.props.lazyLoad && suggestionsLazyLoaded.length > 0) {
            return inputLength === 0 ? [] : suggestionsLazyLoaded.filter(suggest =>
                suggest.name.toLowerCase().slice(0, inputLength) === inputValue
            );
        }
        return inputLength === 0 ? [] : this.props.suggestions.filter(suggest =>
            suggest.name.toLowerCase().slice(0, inputLength) === inputValue
        );
    }

    // When suggestion is clicked, Teach Autosuggest how to calculate the
    // input value for every given suggestion.
    private getSuggestionValue(suggestion: Suggestion) {
        return suggestion.name;
    }

    private renderSuggestion(suggestion: Suggestion) {

        return createElement("span", {
            className: ""
        }, suggestion.name);
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

    private hundleOnChange(_event: Event, inputObject: Suggestion) {
        if (inputObject.method === "type" && this.props.lazyLoad) {
            setTimeout(() => {
                this.fetchSuggestions(this.props);
                this.setState({ lazyLoaded: true });
            }, 1000);
        }
        this.setState({ value: inputObject.newValue });
    }

    private fetchSuggestions(props: AutoCompleteProps) {
        if (props.fetchSuggestions && props.lazyLoad) {
            props.fetchSuggestions();
        }
    }

    private hundleClick(event: Event) {
        const tagContainer = event.target as HTMLElement;
        const suggestionInput = tagContainer.getElementsByTagName("input");

        if (suggestionInput[0] !== null) {
            suggestionInput[0].focus();
        }
    }

    private hundleFocus(event: Event) {
        const suggestionInput = event.target as HTMLElement;
        const inputContainer = suggestionInput.parentElement as HTMLElement;
        const tagSpan = inputContainer.parentElement as HTMLElement;
        const tagContainer = tagSpan.parentElement as HTMLElement;

        tagContainer.classList.add("react-tagsinput--focused");
        tagContainer.classList.add("form-control");
    }

    private hundleContainerFocus(event: Event) {
        const tagContainer = event.target as HTMLElement;
        const suggestionInput = tagContainer.getElementsByTagName("input");

        suggestionInput[0].focus();
    }

    private hundleOnblur(event: Event) {
        const targetElement = event.target as HTMLElement;
        const inputContainer = targetElement.parentElement as HTMLElement;
        const tagSpan = inputContainer.parentElement as HTMLElement;
        const tagContainer = tagSpan.parentElement as HTMLElement;
        const focus = "react-tagsinput--focused";

        targetElement.classList.remove("react-autosuggest__input--focused");
        targetElement.classList.remove("mx-focus");

        tagContainer.classList.add("form-control");
        if (tagContainer.classList.contains(focus)) {
            tagContainer.classList.remove(focus);
        }
    }

    private hundleEnter(event: Event) {
        const input = event.target as HTMLInputElement;
        const keyPress = event as KeyboardEvent;

        if (keyPress.code === "Enter" && keyPress.keyCode === 13 && input.defaultValue !== "") {
            this.props.addTag(input.defaultValue);
            this.setState({ value: "" });
        }
    }
}
