import { Suggestion } from "./../components/AutoComplete";

export const parseStyle = (style = ""): {[key: string]: string} => {
    try {
        return style.split(";").reduce<{[key: string]: string}>((styleObject, line) => {
            const pair = line.split(":");
            if (pair.length === 2) {
                const name = pair[0].trim().replace(/(-.)/g, match => match[1].toUpperCase());
                styleObject[name] = pair[1].trim();
            }
            return styleObject;
        }, {});
    } catch (error) {
        // tslint:disable-next-line no-console
        window.console.log("Failed to parse style", style, error);
    }

    return {};
};

export const processSuggestions = (newSuggestions: string[]): Suggestion[] => {
    const suggestions: Suggestion[] = newSuggestions.map(suggestion => ({
        method: "",
        name: suggestion,
        newValue: "",
        suggestionValue: "",
        value: ""
    }));

    return suggestions;
};

export const changeNode = (tagNode: NodeListOf<Element>) => {
    const formCotrol = "form-control";

    for (let i = 0; tagNode[i]; i++) {
        const node = tagNode[i] as HTMLElement;

        if (!node.classList.contains(formCotrol)) {
            node.classList.add(formCotrol);
        }
    }
};

export const showLoader = (node?: HTMLElement) => {
    if (node) {
        node.classList.add("react-autosuggest__suggestion-loading");
    }
};

export const hideLoader = (node?: HTMLElement) => {
    if (node) {
        node.classList.remove("react-autosuggest__suggestion-loading");
    }
};

export const validateTagInput = (newTag: string, availableTags: string[]): boolean => {
    let valid = false;
    for (const tagValue of availableTags) {
        if (tagValue.localeCompare(newTag) === 0) {
            valid = true;
            break;
        }
    }

    return valid;
};
