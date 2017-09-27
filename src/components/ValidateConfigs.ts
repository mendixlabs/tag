import { Component, ReactElement, createElement } from "react";
import { TagContainerProps } from "./TagContainer";
import { Alert } from "./Alert";

export class ValidateConfigs extends Component<TagContainerProps & { showOnError: boolean }, {}> {
    render() {
        const message = ValidateConfigs.validate(this.props);

        if (message) {
            const alertClassName = "widget-tag-text-alert";
            return this.props.showOnError
                ? createElement("div", { className: "widget-tag-text-invalid" },
                    createElement(Alert, { bootstrapStyle: "danger", className: alertClassName, message }),
                    this.props.children as ReactElement<TagContainerProps>
                ) : createElement(Alert, { bootstrapStyle: "danger", className: alertClassName, message });
        }

        return this.props.children as ReactElement<TagContainerProps>;
    }

    static validate(props: TagContainerProps): string {
        if (props.tagAttribute === "") {
            return `The tag attribute is missing`;
        } else if (props.tagEntity === "") {
            return `The tag entity is missing`;
        }

        return "";
    }
}
