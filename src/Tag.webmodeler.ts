import { Component, createElement } from "react";

import { Tag, TagProps } from "./components/Tag";
import { TagContainerProps } from "./components/TagContainer";

import { ValidateConfigs } from "./utils/ValidateConfigs";

declare function require(name: string): string;

// tslint:disable-next-line class-name
export class preview extends Component<TagContainerProps, {}> {
    render() {
        return createElement(ValidateConfigs, {
            ...this.props as TagContainerProps,
            showOnError: true
        }, createElement(Tag, this.transformProps()));
    }

    private transformProps(): TagProps {

        return {
            inputPlaceholder: "Add a tag",
            showError: () => undefined,
            tagLimit: 2,
            tagLimitMessage: "",
            tagList: [ "Example1", "Example2" ],
            newTag: "",
            suggestions: [ "Suggestion1", "Suggestion2" ]
        };
    }
}

export function getPreviewCss() {
    return (
        require("react-tagsinput/react-tagsinput.css") +
        require("./ui/Tag.scss")
    );
}
