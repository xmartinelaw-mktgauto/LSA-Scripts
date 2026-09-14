(() => {
  "use strict";

  /* =========================================================
     MARTINE LAW
     LSA JOB CATEGORY + PRACTICE AREAS

     SEQUENCE:
     1. Open Job category selector
     2. Wait until selector is visible
     3. Find / scroll to Law
     4. Select Law
     5. Immediately wait for Practice Areas to appear
     6. Check:
        ✓ Criminal law
        ✓ Family law
        ✓ Dui law
        ✓ Traffic law

     DOES NOT TOUCH:
     - State
     - ZIP
     - Appear in general law searches
     - Other practice areas
     - Check Eligibility
     ========================================================= */

  const LOCK =
    "__MARTINE_LSA_LAW_PRACTICE_AREAS_V6__";

  if (window[LOCK]) {
    console.warn(
      "⚠ LSA Job Category automation is already running."
    );
    return;
  }

  window[LOCK] = true;


  /* =========================================================
     CONFIG
     ========================================================= */

  const CONFIG = {
    category: "Law",

    practiceAreas: [
      "Criminal law",
      "Family law",
      "Dui law",
      "Traffic law"
    ],

    /*
     * Maximum time to wait for Google to render
     * Practice Areas after selecting Law.
     *
     * This is NOT a fixed delay.
     * The script continues immediately once they appear.
     */
    practiceAreaTimeout: 5000
  };


  /* =========================================================
     BASIC HELPERS
     ========================================================= */

  const sleep = ms =>
    new Promise(resolve =>
      setTimeout(resolve, ms)
    );


  const normalize = text =>
    String(text || "")
      .toLowerCase()
      .replace(/\u00a0/g, " ")
      .replace(/[’‘]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/\s+/g, " ")
      .trim();


  const visible = element => {
    if (!element) {
      return false;
    }

    const rect =
      element.getBoundingClientRect();

    const style =
      getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden"
    );
  };


  const findExactText = (
    text,
    root = document
  ) => {
    const wanted =
      normalize(text);

    const matches =
      Array.from(
        root.querySelectorAll(
          "span,div,label,p,a,button,li"
        )
      )
      .filter(element =>
        visible(element) &&
        normalize(
          element.textContent
        ) === wanted
      );


    /*
     * Prefer the smallest exact match.
     */

    matches.sort((a, b) => {
      const ar =
        a.getBoundingClientRect();

      const br =
        b.getBoundingClientRect();

      return (
        ar.width * ar.height -
        br.width * br.height
      );
    });


    return matches[0] || null;
  };


  /* =========================================================
     FIND JOB CATEGORY FIELD
     ========================================================= */

  const findJobCategoryField = () => {
    const label =
      findExactText(
        "Job category"
      );

    if (!label) {
      return null;
    }


    const labelRect =
      label.getBoundingClientRect();


    /*
     * Prefer the visible "Select" or "Law" text
     * directly underneath Job category.
     */

    const valueTexts =
      Array.from(
        document.querySelectorAll(
          "span,div"
        )
      )
      .filter(element => {
        if (!visible(element)) {
          return false;
        }

        const text =
          normalize(
            element.textContent
          );

        if (
          text !== "select" &&
          text !== "law"
        ) {
          return false;
        }

        const rect =
          element.getBoundingClientRect();

        return (
          rect.top >=
            labelRect.bottom - 10 &&
          rect.top <=
            labelRect.bottom + 80
        );
      });


    for (
      const valueText of valueTexts
    ) {
      let node =
        valueText;

      for (
        let depth = 0;
        depth < 8 && node;
        depth++
      ) {
        const rect =
          node.getBoundingClientRect();

        if (
          rect.width > 200 &&
          rect.height >= 20 &&
          rect.height <= 70 &&
          (
            node.matches?.(
              [
                '[role="combobox"]',
                '[role="button"]',
                '[aria-haspopup]',
                '[aria-expanded]',
                '[tabindex]'
              ].join(",")
            ) ||
            node.hasAttribute?.(
              "jsaction"
            )
          )
        ) {
          return node;
        }

        node =
          node.parentElement;
      }
    }


    /*
     * Geometric fallback.
     */

    const candidates =
      Array.from(
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
      )
      .filter(element => {
        if (!visible(element)) {
          return false;
        }

        const rect =
          element.getBoundingClientRect();

        return (
          rect.top >=
            labelRect.bottom - 10 &&
          rect.top <=
            labelRect.bottom + 90 &&
          rect.width > 200
        );
      });


    candidates.sort((a, b) =>
      Math.abs(
        a.getBoundingClientRect().top -
        labelRect.bottom
      ) -
      Math.abs(
        b.getBoundingClientRect().top -
        labelRect.bottom
      )
    );


    return candidates[0] || null;
  };


  /* =========================================================
     FIND OPEN CATEGORY MENU
     ========================================================= */

  const findCategoryMenu = () => {
    const candidates =
      Array.from(
        document.querySelectorAll(
          "div,ul"
        )
      )
      .filter(element => {
        if (!visible(element)) {
          return false;
        }


        if (
          element.scrollHeight <=
          element.clientHeight + 25
        ) {
          return false;
        }


        const text =
          normalize(
            element.textContent
          );


        const knownCategories = [
          "kitchen remodeling",
          "landscaping",
          "language instruction",
          "law",
          "law care",
          "locksmith",
          "acupuncture",
          "allergist"
        ];


        const score =
          knownCategories.filter(
            category =>
              text.includes(category)
          ).length;


        return score >= 2;
      });


    /*
     * Prefer the smallest matching list.
     */

    candidates.sort((a, b) => {
      const ar =
        a.getBoundingClientRect();

      const br =
        b.getBoundingClientRect();

      return (
        ar.width * ar.height -
        br.width * br.height
      );
    });


    return candidates[0] || null;
  };


  /* =========================================================
     GENERIC GOOGLE CLICK
     ========================================================= */

  const googleClick =
    async element => {

      if (!element) {
        return false;
      }


      try {
        element.scrollIntoView({
          block: "center",
          behavior: "auto"
        });
      } catch (_) {}


      await sleep(30);


      /*
       * Native click first.
       */

      try {
        element.click();
      } catch (_) {}


      await sleep(80);


      return true;
    };


  /* =========================================================
     STEP 1
     OPEN JOB CATEGORY SELECTOR
     ========================================================= */

  const openJobCategory = async () => {
    console.log(
      "🖱 Opening Job category selector..."
    );


    /*
     * Already open?
     */

    let menu =
      findCategoryMenu();

    if (menu) {
      console.log(
        "✅ Job category selector is already open."
      );

      return menu;
    }


    const field =
      findJobCategoryField();


    if (!field) {
      console.error(
        "❌ Could not find Job category selector."
      );

      return null;
    }


    /*
     * Native click.
     */

    await googleClick(
      field
    );


    /*
     * Wait only until the list actually appears.
     */

    for (
      let attempt = 0;
      attempt < 20;
      attempt++
    ) {
      menu =
        findCategoryMenu();

      if (menu) {
        console.log(
          "✅ Job category selector is visible."
        );

        return menu;
      }

      await sleep(75);
    }


    /*
     * Second-click fallback.
     */

    console.log(
      "↻ Retrying selector..."
    );


    try {
      field.click();
    } catch (_) {}


    for (
      let attempt = 0;
      attempt < 10;
      attempt++
    ) {
      menu =
        findCategoryMenu();

      if (menu) {
        console.log(
          "✅ Job category selector is visible."
        );

        return menu;
      }

      await sleep(75);
    }


    console.error(
      "❌ Job category selector did not appear."
    );


    return null;
  };


  /* =========================================================
     FIND / SCROLL TO LAW
     ========================================================= */

  const findLaw = async menu => {
    /*
     * Check currently rendered options first.
     */

    let law =
      findExactText(
        "Law",
        menu
      );


    if (law) {
      law.scrollIntoView({
        block: "center",
        behavior: "auto"
      });

      await sleep(50);

      return law;
    }


    console.log(
      '🔎 Scrolling category selector to "Law"...'
    );


    const maxScroll =
      Math.max(
        0,
        menu.scrollHeight -
        menu.clientHeight
      );


    const step =
      Math.max(
        100,
        Math.floor(
          menu.clientHeight * 0.45
        )
      );


    for (
      let y = 0;
      y <= maxScroll;
      y += step
    ) {
      menu.scrollTop = y;


      menu.dispatchEvent(
        new Event(
          "scroll",
          {
            bubbles: true
          }
        )
      );


      await sleep(50);


      law =
        findExactText(
          "Law",
          menu
        );


      if (law) {
        law.scrollIntoView({
          block: "center",
          behavior: "auto"
        });

        await sleep(50);

        console.log(
          '🎯 Found "Law".'
        );

        return law;
      }
    }


    /*
     * Final bottom scan.
     */

    menu.scrollTop =
      maxScroll;


    await sleep(80);


    return findExactText(
      "Law",
      menu
    );
  };


  /* =========================================================
     FIND CLICKABLE LAW ROW
     ========================================================= */

  const getLawRow = (
    lawText,
    menu
  ) => {
    if (!lawText) {
      return null;
    }


    const candidates = [];


    let node =
      lawText;


    for (
      let depth = 0;
      depth < 8 &&
      node &&
      node !== menu;
      depth++
    ) {
      const rect =
        node.getBoundingClientRect();


      if (
        rect.height >= 18 &&
        rect.height <= 55
      ) {
        candidates.push(
          node
        );
      }


      node =
        node.parentElement;
    }


    /*
     * Explicit option role.
     */

    const option =
      candidates.find(element =>
        element.matches?.(
          [
            '[role="option"]',
            '[role="menuitem"]',
            '[role="menuitemradio"]'
          ].join(",")
        )
      );


    if (option) {
      return option;
    }


    /*
     * Google JS action row.
     */

    const jsaction =
      candidates.find(element =>
        element.hasAttribute?.(
          "jsaction"
        )
      );


    if (jsaction) {
      return jsaction;
    }


    /*
     * Keyboard / tabindex row.
     */

    const tabindex =
      candidates.find(element =>
        element.hasAttribute?.(
          "tabindex"
        )
      );


    if (tabindex) {
      return tabindex;
    }


    return (
      lawText.parentElement ||
      lawText
    );
  };


  /* =========================================================
     CHECK WHETHER LAW WAS SELECTED
     ========================================================= */

  const lawSelected = () => {
    /*
     * Practice Areas loaded = definitely selected.
     */

    if (
      findExactText(
        "Criminal law"
      )
    ) {
      return true;
    }


    if (
      findExactText(
        "Practice Areas"
      )
    ) {
      return true;
    }


    /*
     * Check displayed Job category value.
     */

    const label =
      findExactText(
        "Job category"
      );


    if (!label) {
      return false;
    }


    const labelRect =
      label.getBoundingClientRect();


    return Array.from(
      document.querySelectorAll(
        "span,div"
      )
    )
      .filter(visible)
      .some(element => {
        if (
          normalize(
            element.textContent
          ) !== "law"
        ) {
          return false;
        }


        const rect =
          element.getBoundingClientRect();


        return (
          rect.top >=
            labelRect.bottom - 10 &&
          rect.top <=
            labelRect.bottom + 80
        );
      });
  };


  /* =========================================================
     CLICK LAW
     ========================================================= */

  const selectLaw = async () => {
    if (
      lawSelected()
    ) {
      console.log(
        "✅ Job category already = Law."
      );

      return true;
    }


    let menu =
      findCategoryMenu() ||
      await openJobCategory();


    if (!menu) {
      return false;
    }


    let lawText =
      await findLaw(
        menu
      );


    if (!lawText) {
      console.error(
        '❌ "Law" could not be found.'
      );

      return false;
    }


    console.log(
      '🎯 Law is visible. Selecting it...'
    );


    let lawRow =
      getLawRow(
        lawText,
        menu
      );


    /*
     * ATTEMPT 1:
     * Native row click.
     */

    try {
      lawRow?.click();
    } catch (_) {}


    /*
     * Immediately poll for result.
     */

    for (
      let i = 0;
      i < 10;
      i++
    ) {
      if (
        lawSelected()
      ) {
        console.log(
          "✅ Job category = Law."
        );

        return true;
      }

      await sleep(75);
    }


    /*
     * ATTEMPT 2:
     * Exact visible Law text.
     */

    menu =
      findCategoryMenu() ||
      menu;


    lawText =
      await findLaw(
        menu
      );


    if (lawText) {
      try {
        lawText.click();
      } catch (_) {}
    }


    for (
      let i = 0;
      i < 10;
      i++
    ) {
      if (
        lawSelected()
      ) {
        console.log(
          "✅ Job category = Law."
        );

        return true;
      }

      await sleep(75);
    }


    /*
     * ATTEMPT 3:
     * Google mouse-event sequence.
     */

    menu =
      findCategoryMenu() ||
      menu;


    lawText =
      await findLaw(
        menu
      );


    lawRow =
      getLawRow(
        lawText,
        menu
      );


    if (lawRow) {
      lawRow.dispatchEvent(
        new MouseEvent(
          "mousedown",
          {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
            button: 0,
            buttons: 1
          }
        )
      );


      lawRow.dispatchEvent(
        new MouseEvent(
          "mouseup",
          {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
            button: 0,
            buttons: 0
          }
        )
      );


      lawRow.dispatchEvent(
        new MouseEvent(
          "click",
          {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
            button: 0
          }
        )
      );
    }


    for (
      let i = 0;
      i < 12;
      i++
    ) {
      if (
        lawSelected()
      ) {
        console.log(
          "✅ Job category = Law."
        );

        return true;
      }

      await sleep(75);
    }


    /*
     * ATTEMPT 4:
     * Keyboard Enter.
     */

    try {
      lawRow?.focus();
    } catch (_) {}


    lawRow?.dispatchEvent(
      new KeyboardEvent(
        "keydown",
        {
          key: "Enter",
          code: "Enter",
          bubbles: true,
          cancelable: true
        }
      )
    );


    lawRow?.dispatchEvent(
      new KeyboardEvent(
        "keyup",
        {
          key: "Enter",
          code: "Enter",
          bubbles: true
        }
      )
    );


    for (
      let i = 0;
      i < 10;
      i++
    ) {
      if (
        lawSelected()
      ) {
        console.log(
          "✅ Job category = Law."
        );

        return true;
      }

      await sleep(75);
    }


    console.error(
      '❌ Could not select "Law".'
    );


    return false;
  };


  /* =========================================================
     WAIT FOR PRACTICE AREAS
     NO FIXED WAIT
     ========================================================= */

  const waitForPracticeAreas =
    async () => {

      console.log(
        "⏳ Waiting for Practice Areas..."
      );


      let elapsed = 0;


      while (
        elapsed <
        CONFIG.practiceAreaTimeout
      ) {
        /*
         * As soon as Google renders Criminal law,
         * continue immediately.
         */

        if (
          findExactText(
            "Criminal law"
          )
        ) {
          console.log(
            "✅ Practice Areas are ready."
          );

          return true;
        }


        await sleep(100);

        elapsed += 100;
      }


      console.error(
        "❌ Practice Areas did not appear."
      );


      return false;
    };


  /* =========================================================
     PRACTICE AREA BINDING
     ========================================================= */

  const findPracticeBinding =
    name => {

      const text =
        findExactText(
          name
        );


      if (!text) {
        return null;
      }


      /*
       * Standard HTML label.
       */

      if (
        text.tagName === "LABEL"
      ) {
        const htmlFor =
          text.getAttribute(
            "for"
          );


        if (htmlFor) {
          const control =
            document.getElementById(
              htmlFor
            );


          if (control) {
            return {
              text,
              control,
              clickTarget:
                text
            };
          }
        }
      }


      /*
       * Walk upward until exactly one checkbox
       * belongs to this option.
       */

      let node =
        text;


      for (
        let depth = 0;
        depth < 7 && node;
        depth++
      ) {
        const controls =
          Array.from(
            node.querySelectorAll?.(
              [
                'input[type="checkbox"]',
                '[role="checkbox"]',
                '[aria-checked]'
              ].join(",")
            ) || []
          );


        if (
          controls.length === 1
        ) {
          return {
            text,
            control:
              controls[0],
            clickTarget:
              node
          };
        }


        node =
          node.parentElement;
      }


      return null;
    };


  /* =========================================================
     CHECKBOX STATE
     ========================================================= */

  const isChecked =
    control => {

      if (!control) {
        return false;
      }


      if (
        typeof control.checked ===
        "boolean"
      ) {
        return control.checked;
      }


      return (
        control.getAttribute(
          "aria-checked"
        ) === "true"
      );
    };


  /* =========================================================
     CHECK ONE PRACTICE AREA
     ========================================================= */

  const checkPracticeArea =
    async name => {

      let binding =
        findPracticeBinding(
          name
        );


      if (!binding) {
        console.error(
          `❌ Not found: ${name}`
        );

        return false;
      }


      if (
        isChecked(
          binding.control
        )
      ) {
        console.log(
          `✅ Already checked: ${name}`
        );

        return true;
      }


      /*
       * Actual checkbox first.
       */

      try {
        binding.control.click();
      } catch (_) {}


      await sleep(80);


      binding =
        findPracticeBinding(
          name
        );


      if (
        binding &&
        isChecked(
          binding.control
        )
      ) {
        console.log(
          `✅ Checked: ${name}`
        );

        return true;
      }


      /*
       * Row / label fallback.
       */

      try {
        binding?.clickTarget?.click();
      } catch (_) {}


      await sleep(80);


      binding =
        findPracticeBinding(
          name
        );


      if (
        binding &&
        isChecked(
          binding.control
        )
      ) {
        console.log(
          `✅ Checked: ${name}`
        );

        return true;
      }


      /*
       * Final mouse-event fallback.
       */

      const target =
        binding?.control ||
        binding?.text;


      if (target) {
        target.dispatchEvent(
          new MouseEvent(
            "mousedown",
            {
              bubbles: true,
              cancelable: true,
              composed: true,
              view: window,
              button: 0,
              buttons: 1
            }
          )
        );


        target.dispatchEvent(
          new MouseEvent(
            "mouseup",
            {
              bubbles: true,
              cancelable: true,
              composed: true,
              view: window,
              button: 0,
              buttons: 0
            }
          )
        );


        target.dispatchEvent(
          new MouseEvent(
            "click",
            {
              bubbles: true,
              cancelable: true,
              composed: true,
              view: window,
              button: 0
            }
          )
        );
      }


      await sleep(80);


      binding =
        findPracticeBinding(
          name
        );


      const success =
        Boolean(
          binding &&
          isChecked(
            binding.control
          )
        );


      console.log(
        success
          ? `✅ Checked: ${name}`
          : `❌ Could not check: ${name}`
      );


      return success;
    };


  /* =========================================================
     MASTER RUN
     ========================================================= */

  const run = async () => {
    console.clear();


    console.log(
      "============================================"
    );

    console.log(
      "🚀 MARTINE LAW"
    );

    console.log(
      "LSA LAW + PRACTICE AREAS"
    );

    console.log(
      "============================================"
    );


    /* =====================================================
       STEP 1
       OPEN SELECTOR
       ===================================================== */

    console.log("");
    console.log(
      "STEP 1 — SHOW JOB CATEGORY SELECTOR"
    );


    const menu =
      await openJobCategory();


    if (!menu) {
      throw new Error(
        "Job category selector could not be displayed."
      );
    }


    /* =====================================================
       STEP 2
       SELECT LAW
       ===================================================== */

    console.log("");
    console.log(
      "STEP 2 — SELECT LAW"
    );


    const lawSuccess =
      await selectLaw();


    if (!lawSuccess) {
      throw new Error(
        "Job category Law could not be selected."
      );
    }


    /* =====================================================
       STEP 3
       NO FIXED WAIT
       ===================================================== */

    console.log("");
    console.log(
      "STEP 3 — WAIT FOR PRACTICE AREAS"
    );


    const ready =
      await waitForPracticeAreas();


    if (!ready) {
      throw new Error(
        "Practice Areas did not load."
      );
    }


    /* =====================================================
       STEP 4
       CHECK FOUR PRACTICE AREAS
       ===================================================== */

    console.log("");
    console.log(
      "STEP 4 — CHECK PRACTICE AREAS"
    );


    const results = {};


    for (
      const area of
      CONFIG.practiceAreas
    ) {
      results[area] =
        await checkPracticeArea(
          area
        );

      await sleep(60);
    }


    /* =====================================================
       FINAL AUDIT
       ===================================================== */

    console.log("");
    console.log(
      "============================================"
    );

    console.log(
      "📋 FINAL AUDIT"
    );

    console.log(
      "============================================"
    );


    console.log(
      lawSelected()
        ? "✅ Job category: Law"
        : "❌ Job category: Law"
    );


    for (
      const area of
      CONFIG.practiceAreas
    ) {
      const binding =
        findPracticeBinding(
          area
        );


      console.log(
        binding &&
        isChecked(
          binding.control
        )
          ? `✅ ${area}`
          : `❌ ${area}`
      );
    }


    console.log("");
    console.log(
      "🔒 State was NOT touched."
    );

    console.log(
      "🔒 ZIP was NOT touched."
    );

    console.log(
      '🔒 "Appear in general law searches" was NOT touched.'
    );

    console.log(
      '🔒 "Check Eligibility" was NOT clicked.'
    );


    console.log("");
    console.log(
      "🏁 LAW + PRACTICE AREA AUTOMATION COMPLETE"
    );
  };


  /* =========================================================
     AUTO START
     ========================================================= */

  run()
    .catch(error => {
      console.error(
        "❌ AUTOMATION ERROR:",
        error
      );
    })
    .finally(() => {
      window[LOCK] = false;
    });

})();
