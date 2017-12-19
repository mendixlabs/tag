import HomePage from "./pages/home.page";
import SuggestionsPage from "./pages/suggestions.page";

const testValue = "testValue";
const removeValue = "foo";

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
        SuggestionsPage.openSuggestion();
        SuggestionsPage.TestInput.waitForVisible();
        SuggestionsPage.TestInput.click();
        SuggestionsPage.TestInput.setValue("te");
        SuggestionsPage.suggestionList.waitForVisible();

        expect(SuggestionsPage.suggestionList.getText()).toContain(testValue);
    });

    it("should remove a tag if exists", () => {
        HomePage.open();
        HomePage.textInput.waitForVisible();
        HomePage.textInput.click();

        HomePage.textInput.setValue(removeValue);
        browser.keys("Enter");
        HomePage.textInput.click();

        HomePage.textInput.click();
        browser.keys("Backspace");
        HomePage.tagsContainer.waitForVisible();

        expect(HomePage.tagsContainer.getText()).not.toContain(removeValue);
    });
});
