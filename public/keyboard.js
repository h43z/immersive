const Keyboard = window.SimpleKeyboard.default
let keyboard = new Keyboard({
  onChange: input => onChange(input),
  onKeyPress: button => onKeyPress(button),
  mergeDisplay: true,
  layoutName: "default",
  theme: "simple-keyboard hg-theme-default hg-layout-default",
  layout: {
    default: [
      "q w e r t y u i o p",
      "a s d f g h j k l",
      "{shift} z x c v b n m {backspace}",
      "{numbers} {space} {ent}"
    ],
    shift: [
      "Q W E R T Y U I O P",
      "A S D F G H J K L",
      "{shift} Z X C V B N M {backspace}",
      "{numbers} {space} {ent}"
    ],
    numbers: ["1 2 3", "4 5 6", "7 8 9", "{abc} 0 {backspace}"]
  },
  display: {
    "{numbers}": "123",
    "{ent}": "return",
    "{escape}": "esc ⎋",
    "{tab}": "tab ⇥",
    "{backspace}": "⌫",
    "{capslock}": "caps lock ⇪",
    "{shift}": "⇧",
    "{controlleft}": "ctrl ⌃",
    "{controlright}": "ctrl ⌃",
    "{altleft}": "alt ⌥",
    "{altright}": "alt ⌥",
    "{metaleft}": "cmd ⌘",
    "{metaright}": "cmd ⌘",
    "{abc}": "ABC"
  }
});

input.addEventListener("input", event => {
  keyboard.setInput(event.target.value);
	keyboard.dispatch(instance => {
    instance.addButtonTheme(event.data, "hg-activeButton");
    setTimeout(_=>{
      instance.removeButtonTheme(event.data, "hg-activeButton");
    }, 100)
	});

});

function onChange(input) {
  document.querySelector("#input").value = input;
}

function onKeyPress(button) {
  if(button === '{backspace}')
    return

  if (button === "{shift}" || button === "{lock}"){
    handleShift();
    return
  }

  if (button === "{numbers}" || button === "{abc}"){
    handleNumbers();
    return
  }

  if(/^[a-z0-9-+"']+$/i.test(button) || !ws.readyState)
    return

  ws.send(input.value.trim())
  input.value = ''
  keyboard.setInput('')
}

function handleShift() {
  let currentLayout = keyboard.options.layoutName;
  let shiftToggle = currentLayout === "default" ? "shift" : "default";

  keyboard.setOptions({
    layoutName: shiftToggle
  });
}


function handleNumbers() {
  let currentLayout = keyboard.options.layoutName;
  let numbersToggle = currentLayout !== "numbers" ? "numbers" : "default";

  keyboard.setOptions({
    layoutName: numbersToggle
  });
}

