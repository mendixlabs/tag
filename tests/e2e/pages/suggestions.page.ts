class Suggestions {
    public get TestInput() { return browser.element(".react-autosuggest__input"); }
    public get suggestionList() { return browser.element(".react-autosuggest__suggestions-list"); }

    public open(): void {
        browser.url("/p/suggestions");
    }
}

const page = new Suggestions();

export default page;
