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

        if (!this.state.lazyLoaded && this.props.lazyLoad) {
            return createElement("span", {
                className: "glyphicon glyphicon-refresh glyphicon-refresh-animate",
                id: "tag-loader"
            });
        } else {

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
    }

    componentDidMount() {
        setTimeout(() => {
            this.setUpSuggestions(this.props);
            this.setState({ lazyLoaded: true
            });
        }, 3000);
    }

    componentWillReceiveProps(newProps: AutoCompleteProps) {
        this.setState({
            lazyLoaded: true,
            suggestions: newProps.suggestions
        });
    }

    private onSuggestionSelected(_event: Event, suggestion: Suggestion) {
        this.props.addTag(suggestion.suggestionValue);
        this.setState({
            value: ""
        });
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

    private onChange = (_event: Event, inputObject: Suggestion) => {
        this.setState({
            value: inputObject.newValue
        });
    }

    private onSuggestionsFetchRequested(suggestion: Suggestion) {
        this.setState({
          suggestions: this.getSuggestions(suggestion)
        });
    }

    private onSuggestionsClearRequested() {
        this.setState({
            suggestions: this.props.suggestions
        });
    }
}
