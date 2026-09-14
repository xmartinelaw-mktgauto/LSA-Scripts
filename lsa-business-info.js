(() => {
  "use strict";

  /* =========================================================
     MARTINE LAW - LSA BUSINESS INFO
     FAST + GOOGLE CUSTOM CHECKBOX FIX
     =========================================================

     EXACTLY THESE 6 ON EVERY AVAILABLE TAB:

     ✓ Evening appointment by request
     ✓ Speaks Spanish
     ✓ Weekend appointment by request
     ✓ Veteran-owned & operated
     ✓ Minority-owned & operated
     ✓ Accepting new clients

     TABS:
     ✓ Criminal Lawyer
     ✓ Family Lawyer - skip if unavailable
     ✓ Lawyer
     ✓ Traffic Lawyer

     DOES NOT CLICK SAVE.
     ========================================================= */

  const LOCK = "__MARTINE_LSA_INFO_V4__";

  if (window[LOCK]) {
    console.warn("⚠ Business Info automation is already running.");
    return;
  }

  window[LOCK] = true;

  window.LSA_INFO = window.LSA_INFO || {};
  const APP = window.LSA_INFO;

  APP.required = [
    "Evening appointment by request",
    "Speaks Spanish",
    "Weekend appointment by request",
    "Veteran-owned & operated",
    "Minority-owned & operated",
    "Accepting new clients"
  ];

  APP.tabs = [
    { name: "Criminal Lawyer", optional: false },
    { name: "Family Lawyer", optional: true },
    { name: "Lawyer", optional: false },
    { name: "Traffic Lawyer", optional: false }
  ];

  APP.delay = {
    tab: 120,
    click: 45,
    retry: 35,
    betweenTabs: 100
  };

  APP.sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

  APP.normalize = text =>
    String(text || "")
      .toLowerCase()
      .replace(/\u00a0/g, " ")
      .replace(/[’‘]/g, "'")
      .replace(/[–—]/g, "-")
      .replace(/&amp;/g, "&")
      .replace(/\s*&\s*/g, " and ")
      .replace(/\s+/g, " ")
      .trim();

  APP.requiredSet = new Set(
    APP.required.map(APP.normalize)
  );


  /* =========================================================
     MODAL
     ========================================================= */

  APP.getModal = () => {

    const dialogs = Array.from(
      document.querySelectorAll(
        '[role="dialog"], [aria-modal="true"]'
      )
    );

    let modal = dialogs.find(el => {
      const text = APP.normalize(el.textContent);

      return (
        text.includes("business info") &&
        text.includes("select up to 6 things")
      );
    });

    if (modal) {
      return modal;
    }

    const candidates = Array.from(
      document.querySelectorAll("div")
    ).filter(el => {

      const text = APP.normalize(el.textContent);

      return (
        text.includes("business info") &&
        text.includes("select up to 6 things") &&
        text.includes("save")
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


  /* =========================================================
     TABS
     ========================================================= */

  APP.findTab = name => {

    const modal = APP.getModal();

    if (!modal) {
      return null;
    }

    const target = APP.normalize(name);

    const roleTabs = Array.from(
      modal.querySelectorAll('[role="tab"]')
    );

    let tab = roleTabs.find(
      el => APP.normalize(el.textContent) === target
    );

    if (tab) {
      return tab;
    }

    const elements = Array.from(
      modal.querySelectorAll(
        "span,div,a,button"
      )
    );

    const match = elements.find(
      el => APP.normalize(el.textContent) === target
    );

    if (!match) {
      return null;
    }

    return (
      match.closest(
        '[role="tab"], [role="button"], button, a'
      ) ||
      match
    );
  };


  APP.openTab = async name => {

    const tab = APP.findTab(name);

    if (!tab) {
      return false;
    }

    /*
     * Always click. Google does not always expose
     * aria-selected correctly on these tabs.
     */

    try {
      tab.click();
    } catch (_) {
      tab.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window
        })
      );
    }

    await APP.sleep(APP.delay.tab);

    return true;
  };


  /* =========================================================
     GOOGLE MENUITEM CHECKBOX ROWS
     ========================================================= */

  APP.getRows = () => {

    const modal = APP.getModal();

    if (!modal) {
      return [];
    }

    return Array.from(
      modal.querySelectorAll(
        '[role="menuitemcheckbox"]'
      )
    ).filter(row => {

      if (
        row.getAttribute("aria-disabled") === "true" ||
        row.getAttribute("callout-disabled") === "true"
      ) {
        return false;
      }

      const rect = row.getBoundingClientRect();

      return (
        rect.width > 0 &&
        rect.height > 0
      );
    });
  };


  APP.label = row => {

    /*
     * Google's text normally sits inside the span whose ID
     * matches the callout-id.
     */

    const calloutId =
      row.getAttribute("callout-id");

    if (calloutId) {

      try {

        const labelElement =
          row.querySelector(
            `#${CSS.escape(calloutId)}`
          );

        if (labelElement) {

          return String(
            labelElement.textContent || ""
          )
            .replace(/\s+/g, " ")
            .trim();
        }

      } catch (_) {}
    }

    return String(
      row.innerText ||
      row.textContent ||
      ""
    )
      .replace(/\s+/g, " ")
      .trim();
  };


  APP.checked = row =>
    row &&
    row.getAttribute("aria-checked") === "true";


  APP.findRow = name => {

    const wanted =
      APP.normalize(name);

    return APP.getRows().find(
      row =>
        APP.normalize(
          APP.label(row)
        ) === wanted
    ) || null;
  };


  /* =========================================================
     NATURAL MOUSE SEQUENCE
     ========================================================= */

  APP.mouseSequence = target => {

    if (!target) {
      return;
    }

    const options = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      button: 0,
      buttons: 1
    };

    /*
     * Google jsaction commonly listens to mouseup,
     * mousedown and click rather than .click() alone.
     */

    try {
      target.dispatchEvent(
        new PointerEvent(
          "pointerdown",
          {
            ...options,
            pointerId: 1,
            pointerType: "mouse",
            isPrimary: true
          }
        )
      );
    } catch (_) {}

    target.dispatchEvent(
      new MouseEvent(
        "mousedown",
        options
      )
    );

    try {
      target.dispatchEvent(
        new PointerEvent(
          "pointerup",
          {
            ...options,
            buttons: 0,
            pointerId: 1,
            pointerType: "mouse",
            isPrimary: true
          }
        )
      );
    } catch (_) {}

    target.dispatchEvent(
      new MouseEvent(
        "mouseup",
        {
          ...options,
          buttons: 0
        }
      )
    );

    target.dispatchEvent(
      new MouseEvent(
        "click",
        {
          ...options,
          buttons: 0
        }
      )
    );
  };


  /* =========================================================
     FIND GOOGLE'S ACTUAL VISUAL CHECKBOX
     ========================================================= */

  APP.getClickTargets = row => {

    const targets = [];

    /*
     * Screenshot shows a nested Google checkbox component
     * with aria-checked / role=presentation.
     */

    const checkboxWidgets =
      Array.from(
        row.querySelectorAll(
          [
            '[role="checkbox"]',
            '[role="presentation"][aria-checked]',
            '[aria-checked]'
          ].join(",")
        )
      );

    checkboxWidgets.forEach(
      el => targets.push(el)
    );

    /*
     * Google's visual box is generally one of the first
     * nested DIVs inside the menuitemcheckbox.
     */

    const directDivs =
      Array.from(
        row.children
      ).filter(
        el => el.tagName === "DIV"
      );

    directDivs.forEach(
      el => targets.push(el)
    );

    /*
     * Finally try the entire menuitem row itself.
     */

    targets.push(row);

    return Array.from(
      new Set(targets)
    );
  };


  /* =========================================================
     WAIT A FEW MS FOR ARIA STATE UPDATE
     ========================================================= */

  APP.waitForState =
    async (name, desired, timeout = 180) => {

      let elapsed = 0;

      while (elapsed <= timeout) {

        const fresh =
          APP.findRow(name);

        if (
          fresh &&
          APP.checked(fresh) === desired
        ) {
          return true;
        }

        await APP.sleep(15);

        elapsed += 15;
      }

      return false;
    };


  /* =========================================================
     FORCE DESIRED STATE
     ========================================================= */

  APP.setState =
    async (name, desired) => {

      let row =
        APP.findRow(name);

      if (!row) {

        console.warn(
          "⚠ Not found:",
          name
        );

        return false;
      }

      if (
        APP.checked(row) === desired
      ) {
        return true;
      }


      const targets =
        APP.getClickTargets(row);


      /*
       * METHOD 1:
       * Native click on each likely Google checkbox target.
       */

      for (
        const target of targets
      ) {

        try {
          target.click();
        } catch (_) {}

        await APP.sleep(APP.delay.click);

        if (
          await APP.waitForState(
            name,
            desired,
            80
          )
        ) {
          return true;
        }
      }


      /*
       * METHOD 2:
       * Full mouse sequence on each target.
       */

      row =
        APP.findRow(name);

      if (!row) {
        return false;
      }

      const freshTargets =
        APP.getClickTargets(row);


      for (
        const target of freshTargets
      ) {

        APP.mouseSequence(target);

        await APP.sleep(APP.delay.retry);

        if (
          await APP.waitForState(
            name,
            desired,
            100
          )
        ) {
          return true;
        }
      }


      /*
       * METHOD 3:
       * Focus row + Enter / Space style interaction.
       */

      row =
        APP.findRow(name);

      if (row) {

        try {

          row.focus({
            preventScroll: true
          });

        } catch (_) {}


        for (
          const key of [" ", "Enter"]
        ) {

          row.dispatchEvent(
            new KeyboardEvent(
              "keydown",
              {
                key,
                code:
                  key === " "
                    ? "Space"
                    : "Enter",
                bubbles: true,
                cancelable: true
              }
            )
          );

          row.dispatchEvent(
            new KeyboardEvent(
              "keyup",
              {
                key,
                code:
                  key === " "
                    ? "Space"
                    : "Enter",
                bubbles: true,
                cancelable: true
              }
            )
          );

          await APP.sleep(
            APP.delay.retry
          );

          if (
            await APP.waitForState(
              name,
              desired,
              100
            )
          ) {
            return true;
          }
        }
      }


      return false;
    };


  /* =========================================================
     CONFIGURE CURRENT TAB
     ========================================================= */

  APP.configureTab =
    async tabName => {

      let rows =
        APP.getRows();


      console.log(
        `📋 ${tabName}: ${rows.length} options found.`
      );


      if (!rows.length) {

        return {
          status: "error"
        };
      }


      /* -----------------------------------------------------
         STEP 1
         Remove every selected option that is not required.
         ----------------------------------------------------- */

      for (
        const row of rows
      ) {

        const name =
          APP.label(row);

        const normalized =
          APP.normalize(name);


        if (
          APP.checked(row) &&
          !APP.requiredSet.has(
            normalized
          )
        ) {

          const success =
            await APP.setState(
              name,
              false
            );


          console.log(
            success
              ? `⬜ Removed: ${name}`
              : `⚠ Could not remove: ${name}`
          );
        }
      }


      /* -----------------------------------------------------
         STEP 2
         Select six required items.
         ----------------------------------------------------- */

      const failures = [];


      for (
        const name of
        APP.required
      ) {

        const success =
          await APP.setState(
            name,
            true
          );


        if (success) {

          console.log(
            `✅ ${name}`
          );

        } else {

          console.warn(
            `❌ Could not select: ${name}`
          );

          failures.push(name);
        }
      }


      /* -----------------------------------------------------
         FINAL STATE DIRECTLY FROM aria-checked
         ----------------------------------------------------- */

      rows =
        APP.getRows();


      const selected =
        rows
          .filter(APP.checked)
          .map(APP.label);


      const requiredSelected =
        APP.required.filter(
          name =>
            selected.some(
              selectedName =>
                APP.normalize(
                  selectedName
                ) ===
                APP.normalize(name)
            )
        );


      const wrongSelected =
        selected.filter(
          name =>
            !APP.requiredSet.has(
              APP.normalize(name)
            )
        );


      const success =
        requiredSelected.length === 6 &&
        wrongSelected.length === 0;


      console.log(
        `${tabName}: ${requiredSelected.length}/6 required selected.`
      );


      if (wrongSelected.length) {

        console.warn(
          "Wrong selections:",
          wrongSelected
        );
      }


      return {
        status:
          success
            ? "processed"
            : "warning",

        selected,
        requiredSelected,
        wrongSelected,
        failures
      };
    };


  /* =========================================================
     PROCESS TAB
     ========================================================= */

  APP.processTab =
    async config => {

      const tab =
        APP.findTab(config.name);


      if (!tab) {

        if (config.optional) {

          console.log(
            `⏭ ${config.name}: unavailable — skipped.`
          );

          return {
            status: "skipped"
          };
        }


        console.error(
          `❌ ${config.name}: tab not found.`
        );

        return {
          status: "missing"
        };
      }


      console.log("");
      console.log(
        "========================================"
      );

      console.log(
        "▶ " +
        config.name.toUpperCase()
      );

      console.log(
        "========================================"
      );


      await APP.openTab(
        config.name
      );


      const result =
        await APP.configureTab(
          config.name
        );


      await APP.sleep(
        APP.delay.betweenTabs
      );


      return result;
    };


  /* =========================================================
     RUN
     ========================================================= */

  APP.run =
    async () => {

      console.clear();


      console.log(
        "========================================"
      );

      console.log(
        "🚀 MARTINE LAW"
      );

      console.log(
        "FAST BUSINESS INFO AUTOMATION V4"
      );

      console.log(
        "========================================"
      );


      if (!APP.getModal()) {

        throw new Error(
          "Business Info modal not found."
        );
      }


      const results = {};


      for (
        const tab of APP.tabs
      ) {

        results[tab.name] =
          await APP.processTab(tab);
      }


      console.log("");
      console.log(
        "========================================"
      );

      console.log(
        "🏁 COMPLETE"
      );

      console.log(
        "========================================"
      );


      APP.tabs.forEach(tab => {

        console.log(
          tab.name + ":",
          results[tab.name]?.status
        );
      });


      console.log("");
      console.log(
        "🔒 SAVE was NOT clicked."
      );


      return results;
    };


  /* =========================================================
     AUTO START
     ========================================================= */

  (async () => {

    try {

      await APP.run();

    } catch (error) {

      console.error(
        "❌ BUSINESS INFO AUTOMATION ERROR:",
        error
      );

    } finally {

      window[LOCK] = false;
    }

  })();

})();
