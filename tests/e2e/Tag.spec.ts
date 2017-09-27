import HomePage from "./pages/home.page";
import SuggestionsPage from "./pages/suggestions.page";

const suggestionValue = "Uganda";
const testValue = "Kenya";

describe("TagInput", () => {

    it("should add a new tag", () => {
        HomePage.open();
        HomePage.textInput.waitForVisible();
        HomePage.textInput.click();
        HomePage.textInput.setValue(testValue);

        browser.keys("Enter");
        HomePage.tagsContainer.waitForVisible();
        const tagsContainer = HomePage.tagsContainer.getText();

        expect(tagsContainer).toContain(testValue);
    });

    it("should remove a tag if exists", () => {
        HomePage.open();
        HomePage.textInput.waitForVisible();
        HomePage.textInput.click();

        browser.keys("Backspace");
        HomePage.tagsContainer.waitForVisible();
        const tagsContainer = HomePage.tagsContainer.getText();

        expect(tagsContainer).toBe("");
    });

    it("should show suggestions when need", () => {
        SuggestionsPage.open();
        SuggestionsPage.TestInput.waitForVisible();
        SuggestionsPage.TestInput.click();
        SuggestionsPage.TestInput.setValue("U");

        SuggestionsPage.suggestionList.waitForVisible();
        const suggestion = SuggestionsPage.suggestionList.getText();

        expect(suggestion).toContain(suggestionValue);
    });
});
