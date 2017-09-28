import HomePage from "./pages/home.page";
import SuggestionsPage from "./pages/suggestions.page";

const suggestionValue = (Math.random() + 1).toString(36).substring(7);
const testValue = "Kenya";
const removeValue = "TestCaseRemove";

describe("TagInput", () => {

    it("should add a new tag", () => {
        HomePage.open();
        HomePage.textInput.waitForVisible();
        HomePage.textInput.click();
        HomePage.textInput.setValue(testValue);

        browser.keys("Enter");
        HomePage.tagsContainer.waitForVisible();

        expect(HomePage.tagsContainer.getText()).toContain(testValue);
    });

    it("should show suggestions when need", () => {
        SuggestionsPage.openCreate();
        HomePage.textInput.waitForVisible();
        HomePage.textInput.click();
        HomePage.textInput.setValue(suggestionValue);
        browser.keys("Enter");

        SuggestionsPage.openSuggestion();
        SuggestionsPage.TestInput.waitForVisible();
        SuggestionsPage.TestInput.click();
        SuggestionsPage.TestInput.setValue(suggestionValue);

        SuggestionsPage.suggestionList.waitForVisible();

        expect(SuggestionsPage.suggestionList.getText()).toContain(suggestionValue);
    });

    it("should remove a tag if exists", () => {
        HomePage.open();
        HomePage.textInput.waitForVisible();
        HomePage.textInput.click();

        HomePage.textInput.setValue(removeValue);
        browser.keys("Enter");
        HomePage.textInput.click();

        browser.keys("Backspace");
        HomePage.tagsContainer.waitForVisible();

        expect(HomePage.tagsContainer.getText()).not.toContain(removeValue);
    });
});
