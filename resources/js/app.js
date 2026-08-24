import "./push";
import calendar from "./calendar";
import 'tippy.js/dist/tippy.css'; // optional for styling
import "tippy.js/animations/scale.css";

// Livewireが自動起動する前にAlpineのコンポーネントを登録する
document.addEventListener('livewire:init', () => {
    window.Alpine.data("taskCalendar", calendar);
});
