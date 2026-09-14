(() => {
  "use strict";

  /* =========================================================
     MARTINE LAW - GOOGLE LSA BUSINESS HOURS AUTOMATION
     =========================================================

     MONDAY    → OPEN 24 HOURS
     TUESDAY   → OPEN 24 HOURS
     WEDNESDAY → OPEN 24 HOURS
     THURSDAY  → OPEN 24 HOURS
     FRIDAY    → OPEN 24 HOURS
     SATURDAY  → OPEN 24 HOURS
     SUNDAY    → OPEN 24 HOURS

     ACTIONS:
     ✓ Uncheck "Closed" for every day
     ✓ Set "Opens at" / hours option to "24 hours"
     ✓ Verify each day
     ✓ Skip nothing unless a day genuinely cannot be found

     IMPORTANT:
     - Does NOT click Next
     - Starts automatically
     ========================================================= */


  /* =========================================================
     RUN LOCK
     ========================================================= */

  const LOCK =
    "__MARTINE_LSA_BUSINESS_HOURS_RUNNING__";


  if (window[LOCK]) {

    console.warn(
      "⚠ Business Hours automation is already running."
    );

    return;
  }


  window[LOCK] = true;


  /* =========================================================
     GLOBAL APP
     ========================================================= */

  window.LSA_HOURS =
    window.LSA_HOURS || {};


  const APP =
    window.LSA_HOURS;


  APP.stopRequested =
    false;


  /* =========================================================
     DAYS
     ========================================================= */

  APP.days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];


  /* =========================================================
     SETTINGS
     ========================================================= */

  APP.settings = {

    afterClosedClick:
      700,

    afterDropdownClick:
      400,

    afterOptionClick:
      500,

    betweenDays:
      400,

    controlWaitTimeout:
      5000,

    pollInterval:
      150,

    resumeDelay:
      800
  };


  /* =========================================================
     BASIC HELPERS
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
        style.visibility !== "hidden" &&
        parseFloat(
          style.opacity || "1"
        ) !== 0
      );
    };


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
     BACKGROUND / VISIBILITY SAFETY
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
        "⏸ LSA page hidden. Business Hours automation paused."
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
        "▶ Page visible again. Resuming..."
      );


      await APP.sleep(
        APP.settings.resumeDelay
      );
    };


  /* =========================================================
     FIND EXACT TEXT
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

          const aArea =
            a.getBoundingClientRect().width *
            a.getBoundingClientRect().height;


          const bArea =
            b.getBoundingClientRect().width *
            b.getBoundingClientRect().height;


          return (
            aArea -
            bArea
          );
        }
      );


      return (
        matches[0] ||
        null
      );
    };


  /* =========================================================
     PAGE VALIDATION
     ========================================================= */

  APP.isBusinessHoursPage =
    function() {

      const text =
        APP.normalize(
          document.body.innerText ||
          document.body.textContent
        );


      return (
        text.includes(
          "business hours"
        ) &&
        text.includes(
          "monday"
        ) &&
        text.includes(
          "sunday"
        )
      );
    };


  /* =========================================================
     FIND DAY CONTAINER

     Starts with the day label and walks upward until it finds
     the smallest parent containing the day + Closed control.
     ========================================================= */

  APP.findDayContainer =
    function(day) {

      const dayElement =
        APP.findExactText(
          day
        );


      if (
        !dayElement
      ) {

        return null;
      }


      let node =
        dayElement;


      for (
        let depth = 0;
        depth < 10 && node;
        depth++
      ) {

        const text =
          APP.normalize(
            node.textContent
          );


        const hasClosedText =
          text.includes(
            "closed"
          );


        const hasControl =
          Boolean(
            node.querySelector?.(
              [
                'input[type="checkbox"]',
                '[role="checkbox"]',
                '[aria-checked]'
              ].join(",")
            )
          );


        /*
         * Prevent selecting the entire Business Hours panel.
         * Prefer a container that doesn't include another day.
         */

        const otherDays =
          APP.days.filter(
            function(otherDay) {

              if (
                otherDay === day
              ) {

                return false;
              }


              return text.includes(
                APP.normalize(
                  otherDay
                )
              );
            }
          );


        if (
          hasClosedText &&
          hasControl &&
          otherDays.length === 0
        ) {

          return node;
        }


        node =
          node.parentElement;
      }


      /*
       * Fallback:
       * find the smallest ancestor that has a checkbox.
       */

      node =
        dayElement;


      for (
        let depth = 0;
        depth < 10 && node;
        depth++
      ) {

        if (
          node.querySelector?.(
            [
              'input[type="checkbox"]',
              '[role="checkbox"]',
              '[aria-checked]'
            ].join(",")
          )
        ) {

          return node;
        }


        node =
          node.parentElement;
      }


      return null;
    };


  /* =========================================================
     FIND CLOSED CHECKBOX FOR DAY
     ========================================================= */

  APP.findClosedControl =
    function(day) {

      const container =
        APP.findDayContainer(
          day
        );


      if (
        !container
      ) {

        return null;
      }


      /*
       * Find "Closed" text inside this day's row.
       */

      const closedText =
        APP.findExactText(
          "Closed",
          container
        );


      if (
        closedText
      ) {

        /*
         * label[for]
         */

        if (
          closedText.tagName ===
          "LABEL"
        ) {

          const htmlFor =
            closedText.getAttribute(
              "for"
            );


          if (
            htmlFor
          ) {

            const control =
              document.getElementById(
                htmlFor
              );


            if (
              control
            ) {

              return {
                container:
                  container,

                control:
                  control,

                clickTarget:
                  closedText
              };
            }
          }
        }


        /*
         * Label wrapping control.
         */

        const label =
          closedText.closest(
            "label"
          );


        if (
          label
        ) {

          const control =
            label.querySelector(
              [
                'input[type="checkbox"]',
                '[role="checkbox"]',
                '[aria-checked]'
              ].join(",")
            );


          if (
            control
          ) {

            return {
              container:
                container,

              control:
                control,

              clickTarget:
                label
            };
          }
        }
      }


      /*
       * Normal case from your screenshot:
       * one checkbox in each day row.
       */

      const controls =
        Array.from(
          container.querySelectorAll(
            [
              'input[type="checkbox"]',
              '[role="checkbox"]',
              '[aria-checked]'
            ].join(",")
          )
        );


      if (
        controls.length
      ) {

        return {
          container:
            container,

          control:
            controls[0],

          clickTarget:
            closedText ||
            controls[0]
        };
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


      if (
        typeof control.checked ===
        "boolean"
      ) {

        return (
          control.checked
        );
      }


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
     UNCHECK CLOSED
     ========================================================= */

  APP.openDay =
    async function(day) {

      APP.checkStop();


      await APP.waitUntilVisible();


      const binding =
        APP.findClosedControl(
          day
        );


      if (
        !binding
      ) {

        console.error(
          `❌ ${day}: Could not find Closed checkbox.`
        );


        return false;
      }


      const current =
        APP.isChecked(
          binding.control
        );


      if (
        current === false
      ) {

        console.log(
          `   ✓ ${day}: Already open.`
        );


        return true;
      }


      console.log(
        `   🔓 ${day}: Unchecking Closed...`
      );


      try {

        binding.control.click();

      } catch (error) {

        try {

          binding.clickTarget.click();

        } catch (error2) {

          binding.control.dispatchEvent(
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
      }


      await APP.sleep(
        APP.settings.afterClosedClick
      );


      /*
       * Google may re-render the entire day row.
       * Find the control again before verifying.
       */

      const updated =
        APP.findClosedControl(
          day
        );


      if (
        updated &&
        APP.isChecked(
          updated.control
        ) === false
      ) {

        console.log(
          `   ✅ ${day}: Closed unchecked.`
        );


        return true;
      }


      console.warn(
        `   ⚠ ${day}: Could not verify Closed was unchecked.`
      );


      return false;
    };


  /* =========================================================
     FIND HOURS CONTROL FOR A DAY
     ========================================================= */

  APP.findHoursControl =
    function(day) {

      const container =
        APP.findDayContainer(
          day
        );


      if (
        !container
      ) {

        return null;
      }


      /* -----------------------------------------------------
         NATIVE SELECT
         ----------------------------------------------------- */

      const selects =
        Array.from(
          container.querySelectorAll(
            "select"
          )
        );


      if (
        selects.length
      ) {

        return {
          type:
            "select",

          control:
            selects[0],

          container:
            container
        };
      }


      /* -----------------------------------------------------
         ARIA COMBOBOX
         ----------------------------------------------------- */

      const combos =
        Array.from(
          container.querySelectorAll(
            [
              '[role="combobox"]',
              '[aria-haspopup="listbox"]',
              '[aria-haspopup="menu"]'
            ].join(",")
          )
        );


      if (
        combos.length
      ) {

        return {
          type:
            "custom",

          control:
            combos[0],

          container:
            container
        };
      }


      /* -----------------------------------------------------
         Look for visible "24 hours" text in row.
         ----------------------------------------------------- */

      const hoursText =
        APP.findExactText(
          "24 hours",
          container
        );


      if (
        hoursText
      ) {

        const clickable =
          hoursText.closest(
            [
              "button",
              '[role="button"]',
              '[role="combobox"]',
              '[aria-haspopup="listbox"]',
              '[aria-haspopup="menu"]'
            ].join(",")
          );


        return {
          type:
            "custom",

          control:
            clickable ||
            hoursText,

          container:
            container
        };
      }


      /*
       * Sometimes the dropdown is rendered as a button without
       * an explicit role. Search small buttons in the day row.
       */

      const buttons =
        Array.from(
          container.querySelectorAll(
            "button"
          )
        )
        .filter(
          APP.isVisible
        );


      if (
        buttons.length
      ) {

        return {
          type:
            "custom",

          control:
            buttons[
              buttons.length - 1
            ],

          container:
            container
        };
      }


      return null;
    };


  /* =========================================================
     WAIT FOR HOURS CONTROL
     ========================================================= */

  APP.waitForHoursControl =
    async function(day) {

      let waited =
        0;


      while (
        waited <
        APP.settings.controlWaitTimeout
      ) {

        APP.checkStop();


        await APP.waitUntilVisible();


        const control =
          APP.findHoursControl(
            day
          );


        if (
          control
        ) {

          return control;
        }


        await APP.sleep(
          APP.settings.pollInterval
        );


        waited +=
          APP.settings.pollInterval;
      }


      return null;
    };


  /* =========================================================
     DOES CONTROL CURRENTLY SAY 24 HOURS?
     ========================================================= */

  APP.is24Hours =
    function(binding) {

      if (
        !binding ||
        !binding.control
      ) {

        return false;
      }


      if (
        binding.type ===
        "select"
      ) {

        const select =
          binding.control;


        const selected =
          select.options[
            select.selectedIndex
          ];


        return (
          selected &&
          APP.normalize(
            selected.textContent
          ) ===
          "24 hours"
        );
      }


      const text =
        APP.normalize(
          binding.control.textContent
        );


      return (
        text.includes(
          "24 hours"
        )
      );
    };


  /* =========================================================
     FIND VISIBLE 24 HOURS DROPDOWN OPTION
     ========================================================= */

  APP.find24HoursOption =
    function(
      currentControl
    ) {

      const elements =
        Array.from(
          document.querySelectorAll(
            [
              '[role="option"]',
              '[role="menuitem"]',
              "li",
              "div",
              "span"
            ].join(",")
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


            if (
              currentControl &&
              (
                element ===
                  currentControl ||
                currentControl.contains(
                  element
                )
              )
            ) {

              return false;
            }


            return (
              APP.normalize(
                element.textContent
              ) ===
              "24 hours"
            );
          }
        );


      /*
       * Prefer actual option/menu elements.
       */

      matches.sort(
        function(a, b) {

          const score =
            function(element) {

              if (
                element.getAttribute(
                  "role"
                ) === "option"
              ) {

                return 0;
              }


              if (
                element.getAttribute(
                  "role"
                ) === "menuitem"
              ) {

                return 1;
              }


              return 2;
            };


          return (
            score(a) -
            score(b)
          );
        }
      );


      return (
        matches[0] ||
        null
      );
    };


  /* =========================================================
     SET DAY TO 24 HOURS
     ========================================================= */

  APP.set24Hours =
    async function(day) {

      APP.checkStop();


      await APP.waitUntilVisible();


      let binding =
        await APP.waitForHoursControl(
          day
        );


      if (
        !binding
      ) {

        console.error(
          `❌ ${day}: Hours dropdown did not appear.`
        );


        return false;
      }


      /*
       * Already 24 hours.
       */

      if (
        APP.is24Hours(
          binding
        )
      ) {

        console.log(
          `   ✓ ${day}: Already set to 24 hours.`
        );


        return true;
      }


      /* -----------------------------------------------------
         NATIVE SELECT
         ----------------------------------------------------- */

      if (
        binding.type ===
        "select"
      ) {

        const select =
          binding.control;


        const option =
          Array.from(
            select.options
          )
          .find(
            function(option) {

              return (
                APP.normalize(
                  option.textContent
                ) ===
                "24 hours"
              );
            }
          );


        if (
          !option
        ) {

          console.error(
            `❌ ${day}: 24 hours option not found.`
          );


          return false;
        }


        select.value =
          option.value;


        select.dispatchEvent(
          new Event(
            "input",
            {
              bubbles:
                true
            }
          )
        );


        select.dispatchEvent(
          new Event(
            "change",
            {
              bubbles:
                true
            }
          )
        );


        await APP.sleep(
          APP.settings.afterOptionClick
        );


        binding =
          APP.findHoursControl(
            day
          );


        if (
          APP.is24Hours(
            binding
          )
        ) {

          console.log(
            `   ✅ ${day}: Set to 24 hours.`
          );


          return true;
        }


        console.warn(
          `   ⚠ ${day}: Could not verify 24 hours.`
        );


        return false;
      }


      /* -----------------------------------------------------
         CUSTOM GOOGLE DROPDOWN
         ----------------------------------------------------- */

      console.log(
        `   🕐 ${day}: Setting to 24 hours...`
      );


      try {

        binding.control.click();

      } catch (error) {

        binding.control.dispatchEvent(
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
        APP.settings.afterDropdownClick
      );


      const option =
        APP.find24HoursOption(
          binding.control
        );


      if (
        !option
      ) {

        /*
         * It is possible Google automatically selected
         * 24 hours when Closed was unchecked.
         */

        binding =
          APP.findHoursControl(
            day
          );


        if (
          binding &&
          APP.is24Hours(
            binding
          )
        ) {

          console.log(
            `   ✅ ${day}: Already set to 24 hours.`
          );


          return true;
        }


        console.error(
          `❌ ${day}: Could not locate the "24 hours" option.`
        );


        return false;
      }


      try {

        option.click();

      } catch (error) {

        option.dispatchEvent(
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
        APP.settings.afterOptionClick
      );


      /*
       * Re-find after Google's DOM update.
       */

      binding =
        APP.findHoursControl(
          day
        );


      if (
        binding &&
        APP.is24Hours(
          binding
        )
      ) {

        console.log(
          `   ✅ ${day}: Set to 24 hours.`
        );


        return true;
      }


      console.warn(
        `   ⚠ ${day}: 24 hours could not be verified.`
      );


      return false;
    };


  /* =========================================================
     PROCESS ONE DAY
     ========================================================= */

  APP.processDay =
    async function(day) {

      APP.checkStop();


      await APP.waitUntilVisible();


      console.log("");
      console.log(
        "--------------------------------------------"
      );

      console.log(
        "▶ " + day.toUpperCase()
      );

      console.log(
        "--------------------------------------------"
      );


      /*
       * STEP 1
       * Uncheck Closed.
       */

      const opened =
        await APP.openDay(
          day
        );


      if (
        !opened
      ) {

        return {
          day:
            day,

          opened:
            false,

          hours:
            false
        };
      }


      /*
       * STEP 2
       * Set to 24 hours.
       */

      const hours =
        await APP.set24Hours(
          day
        );


      return {
        day:
          day,

        opened:
          opened,

        hours:
          hours
      };
    };


  /* =========================================================
     FINAL AUDIT
     ========================================================= */

  APP.audit =
    function() {

      const results = [];


      for (
        const day of APP.days
      ) {

        const closedBinding =
          APP.findClosedControl(
            day
          );


        const hoursBinding =
          APP.findHoursControl(
            day
          );


        const closed =
          closedBinding
            ? APP.isChecked(
                closedBinding.control
              )
            : null;


        const hours24 =
          hoursBinding
            ? APP.is24Hours(
                hoursBinding
              )
            : false;


        results.push({
          day:
            day,

          open:
            closed === false,

          hours24:
            hours24
        });
      }


      console.log("");
      console.log(
        "============================================"
      );

      console.log(
        "📋 FINAL BUSINESS HOURS AUDIT"
      );

      console.log(
        "============================================"
      );


      results.forEach(
        function(result) {

          if (
            result.open &&
            result.hours24
          ) {

            console.log(
              `✅ ${result.day}: OPEN 24 HOURS`
            );

          } else {

            console.warn(
              `⚠ ${result.day}:`,
              {
                open:
                  result.open,

                hours24:
                  result.hours24
              }
            );
          }
        }
      );


      return results;
    };


  /* =========================================================
     MASTER RUN
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
        "   LSA BUSINESS HOURS AUTOMATION"
      );

      console.log(
        "============================================"
      );


      await APP.waitUntilVisible();


      if (
        !APP.isBusinessHoursPage()
      ) {

        throw new Error(
          'This does not appear to be the "Business hours" page.'
        );
      }


      const results = [];


      for (
        let i = 0;
        i < APP.days.length;
        i++
      ) {

        APP.checkStop();


        const day =
          APP.days[i];


        const result =
          await APP.processDay(
            day
          );


        results.push(
          result
        );


        await APP.sleep(
          APP.settings.betweenDays
        );
      }


      /*
       * Final audit.
       */

      await APP.sleep(
        700
      );


      const audit =
        APP.audit();


      const failed =
        audit.filter(
          function(day) {

            return !(
              day.open &&
              day.hours24
            );
          }
        );


      console.log("");
      console.log(
        "============================================"
      );

      console.log(
        "🏁 BUSINESS HOURS AUTOMATION COMPLETE"
      );

      console.log(
        "============================================"
      );


      if (
        failed.length === 0
      ) {

        console.log(
          "✅ MONDAY: OPEN 24 HOURS"
        );

        console.log(
          "✅ TUESDAY: OPEN 24 HOURS"
        );

        console.log(
          "✅ WEDNESDAY: OPEN 24 HOURS"
        );

        console.log(
          "✅ THURSDAY: OPEN 24 HOURS"
        );

        console.log(
          "✅ FRIDAY: OPEN 24 HOURS"
        );

        console.log(
          "✅ SATURDAY: OPEN 24 HOURS"
        );

        console.log(
          "✅ SUNDAY: OPEN 24 HOURS"
        );


        console.log("");
        console.log(
          "✅ All 7 days configured."
        );

      } else {

        console.warn(
          "⚠ The following days need review:",
          failed
        );
      }


      console.log("");
      console.log(
        "🔒 Next was NOT clicked."
      );

      console.log(
        "Please visually review the hours before continuing."
      );


      return {
        results:
          results,

        audit:
          audit,

        failed:
          failed
      };
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
          "🛑 Business Hours automation stopped."
        );

      } else {

        console.error(
          "❌ BUSINESS HOURS AUTOMATION ERROR:",
          error
        );
      }

    } finally {

      window[LOCK] =
        false;
    }

  })();

})();
