(() => {
  "use strict";

  /* =========================================================
     MARTINE LAW - GOOGLE LSA SERVICE TYPES AUTOMATION
     =========================================================

     CRIMINAL LAWYER
     ✓ Domestic violence
     ✓ Drug possession
     ✓ DUIs & reckless driving
     ✓ Felonies
     ✓ Petty crimes & misdemeanors
     ✓ Restraining orders
     ✓ Sex offenses

     DUI LAWYER
     ✓ EVERYTHING EXCEPT "Other"

     TRAFFIC LAWYER
     ✓ DUI
     ✓ Reckless driving
     Everything else unchecked

     FAMILY LAWYER
     ✓ Contested divorce
     ✓ Debt division
     ✓ Modification of orders
     ✓ Parent timesharing
     ✓ Paternity
     ✓ Prenups & marital agreements
     ✓ Property division
     ✓ Restraining orders
     ✓ Spousal support & alimony
     ✓ Uncontested divorce

     IMPORTANT:
     - Skip unavailable tabs
     - Do NOT touch "I agree"
     - Do NOT click Next
     - Starts automatically
     ========================================================= */


  /* =========================================================
     RUN LOCK
     ========================================================= */

  const LOCK =
    "__MARTINE_LSA_SERVICE_TYPES_RUNNING__";


  if (window[LOCK]) {

    console.warn(
      "⚠ LSA Service Types automation is already running."
    );

    return;
  }


  window[LOCK] = true;


  /* =========================================================
     APP
     ========================================================= */

  window.LSA_TYPES =
    window.LSA_TYPES || {};


  const APP =
    window.LSA_TYPES;


  APP.stopRequested =
    false;


  /* =========================================================
     CONFIGURATION
     ========================================================= */

  APP.config = {

    /* -------------------------------------------------------
       CRIMINAL LAWYER
       ------------------------------------------------------- */

    criminal: {

      name:
        "Criminal Lawyer",

      tabs: [
        "Criminal Lawyer"
      ],

      mode:
        "exact",

      services: [
        "Domestic violence",
        "Drug possession",
        "DUIs & reckless driving",
        "Felonies",
        "Petty crimes & misdemeanors",
        "Restraining orders",
        "Sex offenses"
      ]
    },


    /* -------------------------------------------------------
       DUI LAWYER
       ALL EXCEPT OTHER
       ------------------------------------------------------- */

    dui: {

      name:
        "DUI Lawyer",

      tabs: [
        "DUI Lawyer"
      ],

      mode:
        "all-except",

      exclude: [
        "Other"
      ]
    },


    /* -------------------------------------------------------
       TRAFFIC LAWYER
       ONLY DUI + RECKLESS DRIVING
       ------------------------------------------------------- */

    traffic: {

      name:
        "Traffic Lawyer",

      tabs: [
        "Traffic Lawyer"
      ],

      mode:
        "exact",

      services: [
        "DUI",
        "Reckless driving"
      ],

      optional:
        true
    },


    /* -------------------------------------------------------
       FAMILY LAWYER
       ------------------------------------------------------- */

    family: {

      name:
        "Family Lawyer",

      tabs: [
        "Family Lawyer"
      ],

      mode:
        "exact",

      services: [
        "Contested divorce",
        "Debt division",
        "Modification of orders",
        "Parent timesharing",
        "Paternity",
        "Prenups & marital agreements",
        "Property division",
        "Restraining orders",
        "Spousal support & alimony",
        "Uncontested divorce"
      ],

      optional:
        true
    }
  };


  /* =========================================================
     ALL KNOWN SERVICE LABELS

     IMPORTANT:
     This now includes the DUI and Traffic options shown
     in your actual Google LSA screen.
     ========================================================= */

  APP.knownServices = [

    /* ---------------- CRIMINAL ---------------- */

    "Corporate representation",
    "Criminal immigration defense",
    "Domestic violence",
    "Drug possession",
    "DUIs & reckless driving",
    "Expungement",
    "Federal crimes",
    "Felonies",
    "Petty crimes & misdemeanors",
    "Restraining orders",
    "Sex offenses",
    "Three-strikes law",


    /* ---------------- DUI ---------------- */

    "DUI with accident",
    "DUI with injury",
    "DUI/DWI",
    "Felony DUI",
    "Invalid tests",
    "Multiple offenses",
    "Reckless driving",
    "Underage DUI",


    /* ---------------- TRAFFIC ---------------- */

    "Case assessment",
    "DUI",
    "Parking ticket",
    "Red light ticket",
    "Suspended license",
    "CDL traffic ticket",
    "Fix-it ticket",
    "Speeding ticket",
    "Traffic ticket",


    /* ---------------- FAMILY ---------------- */

    "Adoption",
    "Child support",
    "Contested divorce",
    "Debt division",
    "Guardianship",
    "Mediation",
    "Modification of orders",
    "Parent timesharing",
    "Paternity",
    "Prenups & marital agreements",
    "Probate",
    "Property division",
    "Spousal support & alimony",
    "Uncontested divorce",


    /* ---------------- COMMON ---------------- */

    "Other"
  ];


  /* =========================================================
     SETTINGS
     ========================================================= */

  APP.settings = {

    afterTabClick:
      800,

    afterCheckboxClick:
      200,

    betweenTabs:
      600,

    resumeDelay:
      1000
  };


  /* =========================================================
     HELPERS
     ========================================================= */

  APP.sleep =
    function(ms) {

      return new Promise(
        function(resolve) {

          setTimeout(
            resolve,
            ms
          );
        }
      );
    };


  APP.normalize =
    function(text) {

      return String(
        text || ""
      )
        .toLowerCase()
        .replace(
          /\u00a0/g,
          " "
        )
        .replace(
          /[’‘]/g,
          "'"
        )
        .replace(
          /[–—]/g,
          "-"
        )
        .replace(
          /&amp;/g,
          "&"
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();
    };


  APP.canonical =
    function(text) {

      return APP.normalize(
        text
      )
        .replace(
          /\bduis\b/g,
          "dui"
        )
        .replace(
          /\s*&\s*/g,
          " and "
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();
    };


  APP.isVisible =
    function(element) {

      if (!element) {
        return false;
      }


      const rect =
        element.getBoundingClientRect();


      const style =
        window.getComputedStyle(
          element
        );


      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      );
    };


  /* =========================================================
     STOP
     ========================================================= */

  APP.stop =
    function() {

      APP.stopRequested =
        true;


      console.warn(
        "🛑 Stop requested."
      );
    };


  APP.checkStop =
    function() {

      if (
        APP.stopRequested
      ) {

        throw new Error(
          "Automation stopped manually."
        );
      }
    };


  /* =========================================================
     BACKGROUND SAFETY
     ========================================================= */

  APP.waitUntilVisible =
    async function() {

      APP.checkStop();


      if (
        !document.hidden
      ) {

        return;
      }


      console.warn(
        "⏸ Page hidden. Automation paused."
      );


      await new Promise(
        function(resolve) {

          const handler =
            function() {

              if (
                !document.hidden
              ) {

                document.removeEventListener(
                  "visibilitychange",
                  handler
                );


                resolve();
              }
            };


          document.addEventListener(
            "visibilitychange",
            handler
          );


          if (
            !document.hidden
          ) {

            document.removeEventListener(
              "visibilitychange",
              handler
            );


            resolve();
          }
        }
      );


      console.log(
        "▶ Page visible. Resuming..."
      );


      await APP.sleep(
        APP.settings.resumeDelay
      );
    };


  /* =========================================================
     FIND EXACT VISIBLE TEXT
     ========================================================= */

  APP.findExactText =
    function(
      text,
      root = document
    ) {

      const target =
        APP.normalize(
          text
        );


      const elements =
        Array.from(
          root.querySelectorAll(
            "span,div,label,p,a,button"
          )
        );


      const matches =
        elements.filter(
          function(element) {

            if (
              !APP.isVisible(
                element
              )
            ) {

              return false;
            }


            return (
              APP.normalize(
                element.textContent
              ) === target
            );
          }
        );


      /*
       * Prefer smallest / most specific element.
       */

      matches.sort(
        function(a, b) {

          const aLength =
            String(
              a.textContent || ""
            ).length;


          const bLength =
            String(
              b.textContent || ""
            ).length;


          if (
            aLength !== bLength
          ) {

            return (
              aLength -
              bLength
            );
          }


          return (
            a.children.length -
            b.children.length
          );
        }
      );


      return (
        matches[0] ||
        null
      );
    };


  /* =========================================================
     FIND TAB
     ========================================================= */

  APP.findTab =
    function(tabNames) {

      for (
        const tabName of tabNames
      ) {

        const textElement =
          APP.findExactText(
            tabName
          );


        if (
          !textElement
        ) {

          continue;
        }


        /*
         * Normal clickable elements.
         */

        const clickable =
          textElement.closest(
            [
              '[role="tab"]',
              "button",
              "a",
              '[role="button"]'
            ].join(",")
          );


        if (
          clickable
        ) {

          return clickable;
        }


        /*
         * Google may use div/span tab wrappers.
         */

        let parent =
          textElement;


        for (
          let depth = 0;
          depth < 5 && parent;
          depth++
        ) {

          const role =
            parent.getAttribute(
              "role"
            );


          const tabIndex =
            parent.getAttribute(
              "tabindex"
            );


          if (
            role === "tab" ||
            role === "button" ||
            tabIndex !== null
          ) {

            return parent;
          }


          parent =
            parent.parentElement;
        }


        return textElement;
      }


      return null;
    };


  /* =========================================================
     CLICK TAB
     ========================================================= */

  APP.clickTab =
    async function(tab) {

      APP.checkStop();


      await APP.waitUntilVisible();


      tab.scrollIntoView({
        block:
          "center",

        behavior:
          "auto"
      });


      await APP.sleep(
        100
      );


      try {

        tab.click();

      } catch (error) {

        tab.dispatchEvent(
          new MouseEvent(
            "click",
            {
              bubbles:
                true,

              cancelable:
                true,

              view:
                window
            }
          )
        );
      }


      await APP.sleep(
        APP.settings.afterTabClick
      );
    };


  /* =========================================================
     FIND CHECKBOX CONTROL FOR A LABEL
     ========================================================= */

  APP.findControlForText =
    function(
      textElement
    ) {

      if (
        !textElement
      ) {

        return null;
      }


      /* -----------------------------------------------------
         LABEL FOR=""
         ----------------------------------------------------- */

      if (
        textElement.tagName ===
        "LABEL"
      ) {

        const htmlFor =
          textElement.getAttribute(
            "for"
          );


        if (
          htmlFor
        ) {

          const input =
            document.getElementById(
              htmlFor
            );


          if (
            input
          ) {

            return {
              control:
                input,

              clickTarget:
                textElement
            };
          }
        }
      }


      /* -----------------------------------------------------
         LABEL WRAPPING CONTROL
         ----------------------------------------------------- */

      const label =
        textElement.closest(
          "label"
        );


      if (
        label
      ) {

        const checkbox =
          label.querySelector(
            [
              'input[type="checkbox"]',
              '[role="checkbox"]',
              '[aria-checked]'
            ].join(",")
          );


        if (
          checkbox
        ) {

          return {
            control:
              checkbox,

            clickTarget:
              label
          };
        }
      }


      /* -----------------------------------------------------
         WALK UP THROUGH ROW
         ----------------------------------------------------- */

      let node =
        textElement;


      for (
        let depth = 0;
        depth < 8 && node;
        depth++
      ) {

        /*
         * Control inside this container.
         */

        const inside =
          node.querySelector
            ? node.querySelector(
                [
                  'input[type="checkbox"]',
                  '[role="checkbox"]',
                  '[aria-checked]'
                ].join(",")
              )
            : null;


        if (
          inside
        ) {

          return {
            control:
              inside,

            clickTarget:
              node
          };
        }


        /*
         * Search siblings through parent.
         */

        const parent =
          node.parentElement;


        if (
          parent
        ) {

          const sibling =
            parent.querySelector(
              [
                'input[type="checkbox"]',
                '[role="checkbox"]',
                '[aria-checked]'
              ].join(",")
            );


          if (
            sibling
          ) {

            return {
              control:
                sibling,

              clickTarget:
                parent
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

  APP.isChecked =
    function(control) {

      if (
        !control
      ) {

        return null;
      }


      /*
       * Native checkbox.
       */

      if (
        typeof control.checked ===
        "boolean"
      ) {

        return (
          control.checked
        );
      }


      /*
       * ARIA checkbox.
       */

      const aria =
        control.getAttribute(
          "aria-checked"
        );


      if (
        aria === "true"
      ) {

        return true;
      }


      if (
        aria === "false"
      ) {

        return false;
      }


      /*
       * Selected class fallback.
       */

      const classText =
        APP.normalize(
          control.className
        );


      if (
        classText.includes(
          "checked"
        ) ||
        classText.includes(
          "selected"
        )
      ) {

        return true;
      }


      return null;
    };


  /* =========================================================
     FIND SERVICE
     ========================================================= */

  APP.findService =
    function(serviceName) {

      const element =
        APP.findExactText(
          serviceName
        );


      if (
        !element
      ) {

        return null;
      }


      const normalized =
        APP.normalize(
          element.textContent
        );


      /*
       * ABSOLUTE SAFETY:
       * NEVER TOUCH I AGREE.
       */

      if (
        normalized ===
        "i agree"
      ) {

        return null;
      }


      const binding =
        APP.findControlForText(
          element
        );


      if (
        !binding
      ) {

        return null;
      }


      return {
        name:
          serviceName,

        element:
          element,

        binding:
          binding
      };
    };


  /* =========================================================
     MATCH SERVICE NAME
     ========================================================= */

  APP.matches =
    function(
      actual,
      wanted
    ) {

      const a =
        APP.canonical(
          actual
        );


      const w =
        APP.canonical(
          wanted
        );


      if (
        a === w
      ) {

        return true;
      }


      /*
       * DUIs & reckless driving variation.
       */

      if (
        a.includes("dui") &&
        w.includes("dui") &&
        a.includes(
          "reckless driving"
        ) &&
        w.includes(
          "reckless driving"
        )
      ) {

        return true;
      }


      return false;
    };


  /* =========================================================
     GET SERVICES ON CURRENT ACTIVE TAB
     ========================================================= */

  APP.getCurrentServices =
    function() {

      const found = [];


      for (
        const name of
        APP.knownServices
      ) {

        const service =
          APP.findService(
            name
          );


        if (
          service
        ) {

          found.push(
            service
          );
        }
      }


      /*
       * Deduplicate controls.
       *
       * This is important if two labels resolve
       * to the same Google checkbox.
       */

      const unique =
        new Map();


      for (
        const service of found
      ) {

        if (
          !unique.has(
            service.binding.control
          )
        ) {

          unique.set(
            service.binding.control,
            service
          );
        }
      }


      return Array.from(
        unique.values()
      );
    };


  /* =========================================================
     CLICK / SET SERVICE
     ========================================================= */

  APP.setService =
    async function(
      service,
      shouldCheck
    ) {

      APP.checkStop();


      await APP.waitUntilVisible();


      const control =
        service.binding.control;


      const current =
        APP.isChecked(
          control
        );


      /*
       * Already correct.
       */

      if (
        current ===
        shouldCheck
      ) {

        console.log(
          shouldCheck
            ? "   ✓ Already checked:"
            : "   ✓ Already unchecked:",
          service.name
        );


        return true;
      }


      service.element.scrollIntoView({
        block:
          "nearest",

        behavior:
          "auto"
      });


      await APP.sleep(
        80
      );


      /*
       * First try direct control.
       */

      try {

        control.click();

      } catch (error) {

        control.dispatchEvent(
          new MouseEvent(
            "click",
            {
              bubbles:
                true,

              cancelable:
                true,

              view:
                window
            }
          )
        );
      }


      await APP.sleep(
        APP.settings.afterCheckboxClick
      );


      let after =
        APP.isChecked(
          control
        );


      /*
       * If direct click failed, click associated row/label.
       */

      if (
        after !==
          shouldCheck &&
        service.binding.clickTarget &&
        service.binding.clickTarget !==
          control
      ) {

        try {

          service.binding.clickTarget.click();

        } catch (error) {

          service.binding.clickTarget.dispatchEvent(
            new MouseEvent(
              "click",
              {
                bubbles:
                  true,

                cancelable:
                  true,

                view:
                  window
              }
            )
          );
        }


        await APP.sleep(
          APP.settings.afterCheckboxClick
        );


        after =
          APP.isChecked(
            control
          );
      }


      if (
        after ===
        shouldCheck
      ) {

        console.log(
          shouldCheck
            ? "   ✅ Checked:"
            : "   ⬜ Unchecked:",
          service.name
        );


        return true;
      }


      console.warn(
        "   ⚠ Could not verify:",
        service.name
      );


      return false;
    };


  /* =========================================================
     CONFIGURE CURRENT TAB
     ========================================================= */

  APP.configureTab =
    async function(config) {

      APP.checkStop();


      await APP.waitUntilVisible();


      const services =
        APP.getCurrentServices();


      console.log(
        `📋 Detected ${services.length} service options.`
      );


      if (
        !services.length
      ) {

        console.error(
          `❌ No service controls detected for ${config.name}.`
        );


        return {
          success:
            false,

          count:
            0,

          failures:
            [
              "No service controls detected"
            ]
        };
      }


      const failures = [];


      /*
       * Log what was detected.
       */

      console.log(
        "Detected services:",
        services.map(
          service =>
            service.name
        )
      );


      for (
        const service of services
      ) {

        APP.checkStop();


        let shouldCheck =
          false;


        /* ---------------------------------------------------
           ALL EXCEPT MODE
           DUI LAWYER
           --------------------------------------------------- */

        if (
          config.mode ===
          "all-except"
        ) {

          shouldCheck =
            !config.exclude.some(
              function(excluded) {

                return APP.matches(
                  service.name,
                  excluded
                );
              }
            );
        }


        /* ---------------------------------------------------
           EXACT MODE
           --------------------------------------------------- */

        else {

          shouldCheck =
            config.services.some(
              function(wanted) {

                return APP.matches(
                  service.name,
                  wanted
                );
              }
            );
        }


        const success =
          await APP.setService(
            service,
            shouldCheck
          );


        if (
          !success
        ) {

          failures.push(
            service.name
          );
        }
      }


      return {
        success:
          failures.length === 0,

        count:
          services.length,

        failures:
          failures
      };
    };


  /* =========================================================
     PROCESS TAB
     ========================================================= */

  APP.processTab =
    async function(config) {

      APP.checkStop();


      await APP.waitUntilVisible();


      const tab =
        APP.findTab(
          config.tabs
        );


      if (
        !tab
      ) {

        console.log("");
        console.log(
          `⏭ ${config.name} not available — SKIPPED.`
        );


        return {
          status:
            "skipped"
        };
      }


      console.log("");
      console.log(
        "============================================"
      );

      console.log(
        "▶ " +
        config.name.toUpperCase()
      );

      console.log(
        "============================================"
      );


      await APP.clickTab(
        tab
      );


      const result =
        await APP.configureTab(
          config
        );


      if (
        result.success
      ) {

        console.log(
          `✅ ${config.name} complete.`
        );

      } else {

        console.warn(
          `⚠ ${config.name} had problems:`,
          result.failures
        );
      }


      await APP.sleep(
        APP.settings.betweenTabs
      );


      return {
        status:
          result.success
            ? "processed"
            : "warning",

        ...result
      };
    };


  /* =========================================================
     RUN
     ========================================================= */

  APP.run =
    async function() {

      APP.stopRequested =
        false;


      console.clear();


      console.log(
        "============================================"
      );

      console.log(
        "🚀 MARTINE LAW"
      );

      console.log(
        "   LSA SERVICE TYPES AUTOMATION"
      );

      console.log(
        "============================================"
      );


      await APP.waitUntilVisible();


      const pageText =
        APP.normalize(
          document.body.innerText ||
          document.body.textContent
        );


      if (
        !pageText.includes(
          "select services you offer"
        )
      ) {

        throw new Error(
          'This is not the "Select services you offer" page.'
        );
      }


      const results = {};


      /* =====================================================
         CRIMINAL
         ===================================================== */

      results.criminal =
        await APP.processTab(
          APP.config.criminal
        );


      /* =====================================================
         DUI
         ===================================================== */

      results.dui =
        await APP.processTab(
          APP.config.dui
        );


      /* =====================================================
         TRAFFIC
         ===================================================== */

      results.traffic =
        await APP.processTab(
          APP.config.traffic
        );


      /* =====================================================
         FAMILY
         ===================================================== */

      results.family =
        await APP.processTab(
          APP.config.family
        );


      /* =====================================================
         COMPLETE
         ===================================================== */

      console.log("");
      console.log(
        "============================================"
      );

      console.log(
        "🏁 SERVICE TYPE AUTOMATION COMPLETE"
      );

      console.log(
        "============================================"
      );


      console.log(
        "Criminal:",
        results.criminal.status
      );


      console.log(
        "DUI:",
        results.dui.status
      );


      console.log(
        "Traffic:",
        results.traffic.status
      );


      console.log(
        "Family:",
        results.family.status
      );


      console.log("");
      console.log(
        '🔒 "I agree" was NOT touched.'
      );

      console.log(
        "🔒 Next was NOT clicked."
      );


      console.log("");
      console.log(
        "Please visually review the selections."
      );


      return results;
    };


  /* =========================================================
     AUTO START
     ========================================================= */

  (async function() {

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
          "❌ SERVICE TYPES AUTOMATION ERROR:",
          error
        );
      }

    } finally {

      window[LOCK] =
        false;
    }

  })();

})();
