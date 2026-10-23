import "./push";
import calendar from "./calendar";
import deadlineInput from "./deadline";
import "tippy.js/dist/tippy.css"; // optional for styling
import "tippy.js/animations/scale.css";

// Register Alpine components before Livewire auto-starts
document.addEventListener("livewire:init", () => {
    window.Alpine.data("taskCalendar", calendar);
    window.Alpine.data("taskDeadlineInput", deadlineInput);
});
