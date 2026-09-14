(() => {
  "use strict";

  /* =========================================================
     MARTINE LAW - LSA JOB CATEGORY + PRACTICE AREAS
     =========================================================

     JOB CATEGORY:
     ✓ Law

     PRACTICE AREAS:
     ✓ Criminal law
     ✓ Family law
     ✓ Dui law
     ✓ Traffic law

     IMPORTANT:
     - Does NOT touch "Appear in general law searches"
     - Does NOT change other practice areas
     - Does NOT click "Check Eligibility"
     - Starts automatically
     ========================================================= */


  const LOCK =
    "__MARTINE_LSA_JOB_CATEGORY_RUNNING__";


  if (window[LOCK]) {
    console.warn(
      "⚠ Job Category automation is already running."
    );
    return;
  }


  window[LOCK] = true;


  window.LSA_JOB =
    window.LSA_JOB || {};


  const APP =
    window.LSA_JOB;


  APP.stopRequested = false;


  /* =========================================================
     CONFIG
     ========================================================= */

  APP.jobCategory = "Law";


  APP.practiceAreas = [
    "Criminal law",
    "Family law",
    "Dui law",
    "Traffic law"
  ];


  APP.settings = {
    afterDropdownClick: 200,
    afterCategorySelect: 300,
    afterCheckboxClick: 70,
    verifyTimeout: 800,
    verifyPoll: 25
  };


  /* =========================================================
     HELPERS
     ========================================================= */

  APP.sleep = ms =>
    new Promise(resolve =>
      setTimeout(resolve, ms)
    );


  APP.normalize = text =>
    String(text || "")
      .toLowerCase()
      .replace(/\u00a0/g, " ")
      .replace(/[’‘]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/\s+/g, " ")
      .trim();


  APP.isVisible = element => {

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


  APP.stop = () => {

    APP.stopRequested = true;

    console.warn(
      "🛑 Stop requested."
    );
  };


  APP.checkStop = () => {

    if (APP.stopRequested) {
      throw new Error(
        "Automation stopped manually."
      );
    }
  };


  /* =========================================================
     EXACT TEXT FINDER
     ========================================================= */

  APP.findExactText = (
    text,
    root = document
  ) => {

    const target =
      APP.normalize(text);


    const elements =
      Array.from(
        root.querySelectorAll(
          [
            "span",
            "div",
            "label",
            "p",
            "a",
            "button"
          ].join(",")
        )
      );


    const matches =
      elements.filter(element => {

        return (
          APP.isVisible(element) &&
          APP.normalize(
            element.textContent
          ) === target
        );
      });


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
     JOB CATEGORY CONTROL
     ========================================================= */

  APP.findJobCategoryControl = () => {

    const heading =
      APP.findExactText(
        "Job category"
      );


    const practiceHeading =
      APP.findExactText(
        "Practice Areas"
      );


    if (!heading) {
      return null;
    }


    const headingRect =
      heading.getBoundingClientRect();


    const maxY =
      practiceHeading
        ? practiceHeading.getBoundingClientRect().top
        : headingRect.bottom + 150;


    /*
     * Google's category selector may be a button,
     * combobox, aria-haspopup control, or tabindex DIV.
     */

    const candidates =
      Array.from(
        document.querySelectorAll(
          [
            '[role="combobox"]',
            '[aria-haspopup="true"]',
            '[aria-haspopup="listbox"]',
            '[aria-haspopup="menu"]',
            'button',
            '[role="button"]'
          ].join(",")
        )
      )
      .filter(element => {

        if (!APP.isVisible(element)) {
          return false;
        }


        const rect =
          element.getBoundingClientRect();


        return (
          rect.top >= headingRect.bottom - 10 &&
          rect.top < maxY
        );
      });


    /*
     * Prefer a control whose current text is Law.
     */

    const lawControl =
      candidates.find(
        element =>
          APP.normalize(
            element.textContent
          ) === "law"
      );


    if (lawControl) {
      return lawControl;
    }


    /*
     * Otherwise nearest candidate below Job category.
     */

    candidates.sort((a, b) => {

      return (
        a.getBoundingClientRect().top -
        b.getBoundingClientRect().top
      );
    });


    return candidates[0] || null;
  };


  /* =========================================================
     FIND VISIBLE "LAW" DROPDOWN OPTION
     ========================================================= */

  APP.findLawOption = control => {

    const elements =
      Array.from(
        document.querySelectorAll(
          [
            '[role="option"]',
            '[role="menuitem"]',
            '[role="menuitemradio"]',
            'li',
            'div',
            'span'
          ].join(",")
        )
      );


    const matches =
      elements.filter(element => {

        if (!APP.isVisible(element)) {
          return false;
        }


        if (
          control &&
          (
            element === control ||
            control.contains(element)
          )
        ) {
          return false;
        }


        return (
          APP.normalize(
            element.textContent
          ) === "law"
        );
      });


    /*
     * Prefer actual menu/option elements.
     */

    matches.sort((a, b) => {

      const score = element => {

        const role =
          element.getAttribute("role");


        if (role === "option") {
          return 0;
        }


        if (
          role === "menuitem" ||
          role === "menuitemradio"
        ) {
          return 1;
        }


        return 2;
      };


      return score(a) - score(b);
    });


    return matches[0] || null;
  };


  /* =========================================================
     SET JOB CATEGORY TO LAW
     ========================================================= */

  APP.setJobCategory = async () => {

    APP.checkStop();


    const control =
      APP.findJobCategoryControl();


    if (!control) {

      console.error(
        "❌ Could not find Job category selector."
      );

      return false;
    }


    const current =
      APP.normalize(
        control.textContent
      );


    if (current === "law") {

      console.log(
        "✓ Job category already set to Law."
      );

      return true;
    }


    console.log(
      "⚙ Setting Job category to Law..."
    );


    try {

      control.click();

    } catch (_) {

      control.dispatchEvent(
        new MouseEvent(
          "click",
          {
            bubbles: true,
            cancelable: true,
            view: window
          }
        )
      );
    }


    await APP.sleep(
      APP.settings.afterDropdownClick
    );


    const option =
      APP.findLawOption(
        control
      );


    if (!option) {

      console.error(
        '❌ Could not find "Law" in Job category dropdown.'
      );

      return false;
    }


    try {

      option.click();

    } catch (_) {

      option.dispatchEvent(
        new MouseEvent(
          "click",
          {
            bubbles: true,
            cancelable: true,
            view: window
          }
        )
      );
    }


    await APP.sleep(
      APP.settings.afterCategorySelect
    );


    const fresh =
      APP.findJobCategoryControl();


    if (
      fresh &&
      APP.normalize(
        fresh.textContent
      ) === "law"
    ) {

      console.log(
        "✅ Job category: Law"
      );

      return true;
    }


    console.warn(
      "⚠ Law was clicked but could not be verified."
    );


    return false;
  };


  /* =========================================================
     FIND PRACTICE AREA CHECKBOX
     ========================================================= */

  APP.findPracticeBinding = name => {

    const textElement =
      APP.findExactText(name);


    if (!textElement) {
      return null;
    }


    /* -----------------------------------------------------
       label[for]
       ----------------------------------------------------- */

    if (
      textElement.tagName === "LABEL"
    ) {

      const htmlFor =
        textElement.getAttribute(
          "for"
        );


      if (htmlFor) {

        const control =
          document.getElementById(
            htmlFor
          );


        if (control) {

          return {
            name,
            control,
            clickTarget: textElement
          };
        }
      }
    }


    /* -----------------------------------------------------
       Checkbox wrapped in label
       ----------------------------------------------------- */

    const label =
      textElement.closest(
        "label"
      );


    if (label) {

      const control =
        label.querySelector(
          [
            'input[type="checkbox"]',
            '[role="checkbox"]',
            '[aria-checked]'
          ].join(",")
        );


      if (control) {

        return {
          name,
          control,
          clickTarget: label
        };
      }
    }


    /* -----------------------------------------------------
       Walk upward to find row containing checkbox.
       ----------------------------------------------------- */

    let node =
      textElement;


    for (
      let depth = 0;
      depth < 6 && node;
      depth++
    ) {

      const controls =
        node.querySelectorAll
          ? Array.from(
              node.querySelectorAll(
                [
                  'input[type="checkbox"]',
                  '[role="checkbox"]',
                  '[aria-checked]'
                ].join(",")
              )
            )
          : [];


      if (controls.length === 1) {

        return {
          name,
          control: controls[0],
          clickTarget: node
        };
      }


      /*
       * Check immediate sibling/parent row.
       */

      const parent =
        node.parentElement;


      if (parent) {

        const parentControls =
          Array.from(
            parent.querySelectorAll(
              [
                'input[type="checkbox"]',
                '[role="checkbox"]',
                '[aria-checked]'
              ].join(",")
            )
          );


        if (parentControls.length === 1) {

          return {
            name,
            control: parentControls[0],
            clickTarget: parent
          };
        }
      }


      node =
        node.parentElement;
    }


    return null;
  };


  /* =========================================================
     CHECKED STATE
     ========================================================= */

  APP.isChecked = control => {

    if (!control) {
      return null;
    }


    if (
      typeof control.checked ===
      "boolean"
    ) {

      return control.checked;
    }


    const aria =
      control.getAttribute(
        "aria-checked"
      );


    if (aria === "true") {
      return true;
    }


    if (aria === "false") {
      return false;
    }


    return null;
  };


  /* =========================================================
     WAIT FOR CHECKED STATE
     ========================================================= */

  APP.waitForChecked =
    async (
      name,
      desired
    ) => {

      let elapsed = 0;


      while (
        elapsed <
        APP.settings.verifyTimeout
      ) {

        const binding =
          APP.findPracticeBinding(
            name
          );


        if (
          binding &&
          APP.isChecked(
            binding.control
          ) === desired
        ) {

          return true;
        }


        await APP.sleep(
          APP.settings.verifyPoll
        );


        elapsed +=
          APP.settings.verifyPoll;
      }


      return false;
    };


  /* =========================================================
     CHECK PRACTICE AREA
     ========================================================= */

  APP.checkPracticeArea =
    async name => {

      APP.checkStop();


      let binding =
        APP.findPracticeBinding(
          name
        );


      if (!binding) {

        console.error(
          `❌ Practice Area not found: ${name}`
        );

        return false;
      }


      if (
        APP.isChecked(
          binding.control
        ) === true
      ) {

        console.log(
          `✓ Already checked: ${name}`
        );

        return true;
      }


      /*
       * First try the actual checkbox.
       */

      try {

        binding.control.click();

      } catch (_) {}


      if (
        await APP.waitForChecked(
          name,
          true
        )
      ) {

        console.log(
          `✅ Checked: ${name}`
        );

        return true;
      }


      /*
       * Google fallback: click row/label.
       */

      binding =
        APP.findPracticeBinding(
          name
        );


      if (
        binding &&
        binding.clickTarget
      ) {

        try {

          binding.clickTarget.click();

        } catch (_) {

          binding.clickTarget.dispatchEvent(
            new MouseEvent(
              "click",
              {
                bubbles: true,
                cancelable: true,
                view: window
              }
            )
          );
        }
      }


      if (
        await APP.waitForChecked(
          name,
          true
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

      binding =
        APP.findPracticeBinding(
          name
        );


      if (binding) {

        const target =
          binding.control;


        target.dispatchEvent(
          new MouseEvent(
            "mousedown",
            {
              bubbles: true,
              cancelable: true,
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
              view: window,
              button: 0,
              buttons: 0
            }
          )
        );
      }


      if (
        await APP.waitForChecked(
          name,
          true
        )
      ) {

        console.log(
          `✅ Checked: ${name}`
        );

        return true;
      }


      console.warn(
        `⚠ Could not check: ${name}`
      );


      return false;
    };


  /* =========================================================
     RUN
     ========================================================= */

  APP.run = async () => {

    APP.stopRequested = false;


    console.clear();


    console.log(
      "============================================"
    );

    console.log(
      "🚀 MARTINE LAW"
    );

    console.log(
      "LSA JOB CATEGORY + PRACTICE AREAS"
    );

    console.log(
      "============================================"
    );


    /* -----------------------------------------------------
       STEP 1
       JOB CATEGORY = LAW
       ----------------------------------------------------- */

    console.log("");
    console.log(
      "STEP 1 — JOB CATEGORY"
    );


    const categorySuccess =
      await APP.setJobCategory();


    /* -----------------------------------------------------
       STEP 2
       PRACTICE AREAS
       ----------------------------------------------------- */

    console.log("");
    console.log(
      "STEP 2 — PRACTICE AREAS"
    );


    const results = {};


    for (
      const name of
      APP.practiceAreas
    ) {

      results[name] =
        await APP.checkPracticeArea(
          name
        );
    }


    /* -----------------------------------------------------
       FINAL AUDIT
       ----------------------------------------------------- */

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
      "Job category:",
      categorySuccess
        ? "✅ Law"
        : "⚠ Review"
    );


    for (
      const name of
      APP.practiceAreas
    ) {

      const binding =
        APP.findPracticeBinding(
          name
        );


      const checked =
        binding
          ? APP.isChecked(
              binding.control
            )
          : false;


      console.log(
        `${checked ? "✅" : "⚠"} ${name}`
      );
    }


    console.log("");
    console.log(
      '🔒 "Appear in general law searches" was NOT touched.'
    );


    console.log(
      "🔒 Other Practice Areas were NOT changed."
    );


    console.log(
      '🔒 "Check Eligibility" was NOT clicked.'
    );


    console.log("");
    console.log(
      "🏁 JOB CATEGORY AUTOMATION COMPLETE"
    );


    return {
      categorySuccess,
      practiceAreas: results
    };
  };


  /* =========================================================
     AUTO START
     ========================================================= */

  (async () => {

    try {

      await APP.run();

    } catch (error) {

      if (
        APP.stopRequested
      ) {

        console.warn(
          "🛑 Automation stopped."
        );

      } else {

        console.error(
          "❌ JOB CATEGORY AUTOMATION ERROR:",
          error
        );
      }

    } finally {

      window[LOCK] = false;
    }

  })();

})();
