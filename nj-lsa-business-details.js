(() => {
  "use strict";

  const CONFIG = {
    state: "New Jersey",
    businessName: "Martine Law, PLLC",
    firstName: "Gillian",
    lastName: "Feehan",
    professionals: "20",
    yearFounded: "2019",
    languages: [
      "English",
      "Spanish",
      "Spanish (Latin America)"
    ]
  };

  const LOCK = "__NJ_LSA_BUSINESS_DETAILS_V7__";

  if (window[LOCK]) {
    console.warn("⚠ New Jersey Business Details already running.");
    return;
  }

  window[LOCK] = true;

  const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

  const normalize = text =>
    String(text || "")
      .toLowerCase()
      .replace(/\u00a0/g, " ")
      .replace(/[’‘]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/\s+/g, " ")
      .trim();

  const visible = element => {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden"
    );
  };

  const findExactText = text => {
    const wanted = normalize(text);

    const matches = Array.from(
      document.querySelectorAll("label,span,div,p")
    ).filter(
      element =>
        visible(element) &&
        normalize(element.textContent) === wanted
    );

    matches.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();

      return (
        ar.width * ar.height -
        br.width * br.height
      );
    });

    return matches[0] || null;
  };

  const findInput = labelText => {
    const label = findExactText(labelText);

    if (!label) return null;

    if (label.tagName === "LABEL") {
      const htmlFor = label.getAttribute("for");

      if (htmlFor) {
        const input = document.getElementById(htmlFor);
        if (input) return input;
      }
    }

    let node = label;

    for (
      let depth = 0;
      depth < 7 && node;
      depth++
    ) {
      const inputs = Array.from(
        node.querySelectorAll?.("input") || []
      ).filter(visible);

      if (inputs.length === 1) {
        return inputs[0];
      }

      if (node.parentElement) {
        const parentInputs = Array.from(
          node.parentElement.querySelectorAll("input")
        ).filter(visible);

        if (parentInputs.length === 1) {
          return parentInputs[0];
        }
      }

      node = node.parentElement;
    }

    return null;
  };

  const setInput = async (label, value) => {
    const input = findInput(label);

    if (!input) {
      console.warn(`⚠ Field not found: ${label}`);
      return false;
    }

    if (String(input.value) === String(value)) {
      console.log(`✅ ${label}: ${value}`);
      return true;
    }

    const oldValue = input.value;

    const setter =
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      )?.set;

    input.focus();

    if (setter) {
      setter.call(input, value);
    } else {
      input.value = value;
    }

    if (input._valueTracker) {
      input._valueTracker.setValue(oldValue);
    }

    input.dispatchEvent(
      new Event("input", { bubbles: true })
    );

    input.dispatchEvent(
      new Event("change", { bubbles: true })
    );

    input.blur();

    await sleep(60);

    const success =
      String(input.value) === String(value);

    console.log(
      success
        ? `✅ ${label}: ${value}`
        : `⚠ ${label} could not be verified`
    );

    return success;
  };

  const findLanguageTrigger = () => {
    const languagesText = Array.from(
      document.querySelectorAll("span,div,label")
    )
      .filter(visible)
      .find(
        element =>
          normalize(element.textContent) ===
          "languages spoken"
      );

    if (languagesText) {
      let node = languagesText;

      for (
        let depth = 0;
        depth < 8 && node;
        depth++
      ) {
        if (
          node.matches?.(
            [
              '[role="combobox"]',
              '[role="button"]',
              '[aria-haspopup]',
              '[aria-expanded]',
              '[tabindex]'
            ].join(",")
          )
        ) {
          return node;
        }

        if (node.hasAttribute?.("jsaction")) {
          const rect = node.getBoundingClientRect();

          if (
            rect.width > 200 &&
            rect.height < 100
          ) {
            return node;
          }
        }

        node = node.parentElement;
      }
    }

    const year =
      findExactText("Year founded");

    const street = Array.from(
      document.querySelectorAll("input")
    ).find(
      input =>
        visible(input) &&
        normalize(input.placeholder) ===
          "street address"
    );

    const minY =
      year
        ? year.getBoundingClientRect().bottom
        : 0;

    const maxY =
      street
        ? street.getBoundingClientRect().top
        : Infinity;

    const candidates = Array.from(
      document.querySelectorAll(
        [
          '[role="combobox"]',
          '[role="button"]',
          '[aria-haspopup]',
          '[aria-expanded]',
          '[tabindex]',
          '[jsaction]'
        ].join(",")
      )
    ).filter(element => {
      if (!visible(element)) return false;

      const rect =
        element.getBoundingClientRect();

      return (
        rect.top >= minY - 20 &&
        rect.bottom <= maxY + 20 &&
        rect.width > 200 &&
        rect.height < 100
      );
    });

    candidates.sort(
      (a, b) =>
        b.getBoundingClientRect().width -
        a.getBoundingClientRect().width
    );

    return candidates[0] || null;
  };

  const findLanguageMenu = () => {
    const candidates = Array.from(
      document.querySelectorAll("div,ul")
    ).filter(element => {
      if (!visible(element)) return false;

      const text =
        normalize(element.textContent);

      const known = [
        "english",
        "french",
        "german",
        "italian",
        "spanish",
        "portuguese"
      ];

      const score =
        known.filter(language =>
          text.includes(language)
        ).length;

      return (
        score >= 4 &&
        element.scrollHeight >
          element.clientHeight + 40
      );
    });

    candidates.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();

      return (
        ar.width * ar.height -
        br.width * br.height
      );
    });

    return candidates[0] || null;
  };

  const openLanguageMenu = async () => {
    let menu =
      findLanguageMenu();

    if (menu) return menu;

    const trigger =
      findLanguageTrigger();

    if (!trigger) {
      console.error(
        "❌ Languages Spoken control not found."
      );
      return null;
    }

    try {
      trigger.click();
    } catch (_) {
      trigger.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window
        })
      );
    }

    for (
      let i = 0;
      i < 20;
      i++
    ) {
      await sleep(40);

      menu =
        findLanguageMenu();

      if (menu) {
        console.log(
          "✅ Languages selector opened."
        );
        return menu;
      }
    }

    return null;
  };

  const getSelectedLanguageData = () => {
    const values = [];

    const elements = Array.from(
      document.querySelectorAll(
        [
          '[selected-option-names]',
          '[data-selected-option-names]'
        ].join(",")
      )
    );

    for (const element of elements) {
      const first =
        element.getAttribute(
          "selected-option-names"
        );

      const second =
        element.getAttribute(
          "data-selected-option-names"
        );

      if (first) values.push(first);
      if (second) values.push(second);
    }

    return values;
  };

  const parseSelectedNames = raw => {
    if (!raw) return [];

    try {
      const parsed =
        JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed.map(normalize);
      }

      if (typeof parsed === "string") {
        return [normalize(parsed)];
      }
    } catch (_) {}

    return String(raw)
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map(item =>
        normalize(
          item
            .replace(/^["']/, "")
            .replace(/["']$/, "")
        )
      )
      .filter(Boolean);
  };

  const getSelectedLanguages = () => {
    const selected =
      new Set();

    for (
      const raw of
      getSelectedLanguageData()
    ) {
      for (
        const name of
        parseSelectedNames(raw)
      ) {
        selected.add(name);
      }
    }

    return selected;
  };

  const optionState = row => {
    if (!row) return null;

    const candidates = [
      row,
      ...Array.from(
        row.querySelectorAll(
          [
            '[aria-selected]',
            '[aria-checked]',
            'input[type="checkbox"]'
          ].join(",")
        )
      )
    ];

    for (const element of candidates) {
      if (
        element.tagName === "INPUT" &&
        typeof element.checked ===
          "boolean" &&
        element.checked
      ) {
        return true;
      }

      if (
        element.getAttribute?.(
          "aria-checked"
        ) === "true"
      ) {
        return true;
      }

      if (
        element.getAttribute?.(
          "aria-selected"
        ) === "true"
      ) {
        return true;
      }
    }

    return null;
  };

  const findLanguageText = (
    menu,
    language
  ) => {
    const wanted =
      normalize(language);

    const matches = Array.from(
      menu.querySelectorAll(
        "span,div,label,li"
      )
    ).filter(
      element =>
        normalize(element.textContent) ===
        wanted
    );

    matches.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();

      return (
        ar.width * ar.height -
        br.width * br.height
      );
    });

    return matches[0] || null;
  };

  const getLanguageRow = (
    textElement,
    menu
  ) => {
    if (!textElement) return null;

    const chain = [];
    let node = textElement;

    for (
      let depth = 0;
      depth < 8 &&
      node &&
      node !== menu;
      depth++
    ) {
      chain.push(node);
      node = node.parentElement;
    }

    let row =
      chain.find(element =>
        element.matches?.(
          [
            '[role="option"]',
            '[role="menuitem"]',
            '[role="menuitemcheckbox"]',
            '[role="checkbox"]'
          ].join(",")
        )
      );

    if (row) return row;

    row =
      chain.find(element =>
        element.hasAttribute?.("jsaction")
      );

    if (row) return row;

    row =
      chain.find(element =>
        element.hasAttribute?.("tabindex")
      );

    if (row) return row;

    return (
      textElement.parentElement ||
      textElement
    );
  };

  const scrollToLanguage = async (
    menu,
    language
  ) => {
    let text =
      findLanguageText(
        menu,
        language
      );

    if (text) {
      text.scrollIntoView({
        block: "center",
        behavior: "auto"
      });

      await sleep(50);
      return text;
    }

    const max =
      Math.max(
        0,
        menu.scrollHeight -
        menu.clientHeight
      );

    const step =
      Math.max(
        140,
        Math.floor(
          menu.clientHeight * 0.65
        )
      );

    for (
      let y = 0;
      y <= max;
      y += step
    ) {
      menu.scrollTop = y;

      menu.dispatchEvent(
        new Event("scroll", {
          bubbles: true
        })
      );

      await sleep(35);

      text =
        findLanguageText(
          menu,
          language
        );

      if (text) {
        text.scrollIntoView({
          block: "center",
          behavior: "auto"
        });

        await sleep(50);
        return text;
      }
    }

    menu.scrollTop = max;
    await sleep(60);

    return findLanguageText(
      menu,
      language
    );
  };

  const languageSelected = (
    language,
    menu
  ) => {
    const wanted =
      normalize(language);

    if (
      getSelectedLanguages().has(
        wanted
      )
    ) {
      return true;
    }

    if (menu) {
      const text =
        findLanguageText(
          menu,
          language
        );

      if (text) {
        const row =
          getLanguageRow(
            text,
            menu
          );

        if (
          optionState(row) === true
        ) {
          return true;
        }
      }
    }

    return false;
  };

  const fireGoogleClick = async element => {
    if (!element) return;

    element.scrollIntoView({
      block: "center",
      behavior: "auto"
    });

    await sleep(30);

    const rect =
      element.getBoundingClientRect();

    const x =
      rect.left +
      rect.width / 2;

    const y =
      rect.top +
      rect.height / 2;

    let target =
      document.elementFromPoint(
        x,
        y
      );

    if (
      !target ||
      !element.contains(target)
    ) {
      target = element;
    }

    const base = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      button: 0
    };

    target.dispatchEvent(
      new MouseEvent(
        "mousedown",
        {
          ...base,
          buttons: 1
        }
      )
    );

    target.dispatchEvent(
      new MouseEvent(
        "mouseup",
        {
          ...base,
          buttons: 0
        }
      )
    );

    target.dispatchEvent(
      new MouseEvent(
        "click",
        {
          ...base,
          buttons: 0
        }
      )
    );

    await sleep(100);
  };

  const selectLanguage = async (
    language,
    menu
  ) => {
    if (
      languageSelected(
        language,
        menu
      )
    ) {
      console.log(
        `✅ Already checked: ${language}`
      );
      return true;
    }

    console.log(
      `🌐 Checking: ${language}`
    );

    const textElement =
      await scrollToLanguage(
        menu,
        language
      );

    if (!textElement) {
      console.error(
        `❌ Could not find: ${language}`
      );
      return false;
    }

    console.log(
      `🎯 Found: ${language}`
    );

    const row =
      getLanguageRow(
        textElement,
        menu
      );

    if (!row) {
      return false;
    }

    await fireGoogleClick(row);

    let freshMenu =
      findLanguageMenu() ||
      menu;

    for (
      let i = 0;
      i < 8;
      i++
    ) {
      if (
        languageSelected(
          language,
          freshMenu
        )
      ) {
        console.log(
          `✅ Checked: ${language}`
        );
        return true;
      }

      await sleep(40);

      freshMenu =
        findLanguageMenu() ||
        freshMenu;
    }

    const freshText =
      await scrollToLanguage(
        freshMenu,
        language
      );

    if (freshText) {
      await fireGoogleClick(
        freshText
      );

      for (
        let i = 0;
        i < 8;
        i++
      ) {
        if (
          languageSelected(
            language,
            freshMenu
          )
        ) {
          console.log(
            `✅ Checked: ${language}`
          );
          return true;
        }

        await sleep(40);
      }
    }

    console.warn(
      `⚠ Could not confirm: ${language}`
    );

    return false;
  };

  const closeLanguageMenu = async () => {
    if (!findLanguageMenu()) {
      console.log(
        "✅ Language selector already closed."
      );
      return true;
    }

    document.dispatchEvent(
      new KeyboardEvent(
        "keydown",
        {
          key: "Escape",
          code: "Escape",
          bubbles: true,
          cancelable: true
        }
      )
    );

    document.dispatchEvent(
      new KeyboardEvent(
        "keyup",
        {
          key: "Escape",
          code: "Escape",
          bubbles: true
        }
      )
    );

    await sleep(120);

    if (findLanguageMenu()) {
      const year =
        findExactText(
          "Year founded"
        );

      try {
        year?.click();
      } catch (_) {}

      await sleep(100);
    }

    if (findLanguageMenu()) {
      const trigger =
        findLanguageTrigger();

      try {
        trigger?.click();
      } catch (_) {}

      await sleep(100);
    }

    const closed =
      !findLanguageMenu();

    console.log(
      closed
        ? "✅ Languages selector CLOSED."
        : "⚠ Languages selector is still OPEN."
    );

    return closed;
  };

  const run = async () => {
    console.clear();

    console.log(
      "============================================"
    );
    console.log(
      "🚀 NEW JERSEY BUSINESS DETAILS"
    );
    console.log(
      "============================================"
    );

    await setInput(
      "Business name",
      CONFIG.businessName
    );

    await setInput(
      "Owner's first name",
      CONFIG.firstName
    );

    await setInput(
      "Owner's last name",
      CONFIG.lastName
    );

    await setInput(
      "Total number of professionals",
      CONFIG.professionals
    );

    await setInput(
      "Year founded",
      CONFIG.yearFounded
    );

    console.log("");
    console.log(
      "🌐 OPENING LANGUAGES SPOKEN"
    );

    let menu =
      await openLanguageMenu();

    if (!menu) {
      throw new Error(
        "Could not open Languages Spoken."
      );
    }

    const results = {};

    for (
      const language of
      CONFIG.languages
    ) {
      menu =
        findLanguageMenu() ||
        menu;

      results[language] =
        await selectLanguage(
          language,
          menu
        );

      await sleep(60);
    }

    menu =
      findLanguageMenu() ||
      menu;

    const finalStates = {};

    for (
      const language of
      CONFIG.languages
    ) {
      finalStates[language] =
        languageSelected(
          language,
          menu
        );
    }

    const allThree =
      CONFIG.languages.every(
        language =>
          finalStates[language]
      );

    console.log("");
    console.log(
      "🌐 LANGUAGE RESULT"
    );

    CONFIG.languages.forEach(
      language =>
        console.log(
          finalStates[language]
            ? `✅ ${language}`
            : `❌ ${language}`
        )
    );

    if (allThree) {
      console.log(
        "✅ ALL 3 LANGUAGES SELECTED"
      );

      await closeLanguageMenu();
    } else {
      console.warn(
        "⚠ Languages incomplete. Selector left open."
      );
    }

    console.log("");
    console.log(
      "🔒 Next was NOT clicked."
    );

    console.log(
      "🏁 NEW JERSEY BUSINESS DETAILS COMPLETE"
    );
  };

  run()
    .catch(error => {
      console.error(
        "❌ NEW JERSEY BUSINESS DETAILS ERROR:",
        error
      );
    })
    .finally(() => {
      window[LOCK] = false;
    });
})();
