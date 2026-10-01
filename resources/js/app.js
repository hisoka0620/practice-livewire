import "./push";
import calendar from "./calendar";
import deadlineInput from "./deadline";
import "tippy.js/dist/tippy.css"; // optional for styling
import "tippy.js/animations/scale.css";

// Livewireが自動起動する前にAlpineのコンポーネントを登録する
document.addEventListener("livewire:init", () => {
    window.Alpine.data("taskCalendar", calendar);
    window.Alpine.data("taskDeadlineInput", deadlineInput);
});
