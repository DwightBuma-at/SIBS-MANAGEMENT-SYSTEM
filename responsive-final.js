(function () {
  const mobileQuery = window.matchMedia("(max-width: 1023px)");

  function getStorageKey() {
    return document.querySelector(".employee-sidebar")
      ? "sibsEmployeeSidebarCollapsed"
      : "sibsSidebarCollapsed";
  }

  function refreshToggleIcon(isCollapsed) {
    const toggle = document.getElementById("sidebarToggle");
    if (!toggle) return;

    toggle.innerHTML = isCollapsed
      ? '<i data-lucide="menu" class="h-5 w-5"></i>'
      : '<i data-lucide="x" class="h-5 w-5"></i>';

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  function setCollapsed(isCollapsed) {
    document.body.classList.toggle("sidebar-collapsed", isCollapsed);
    try {
      localStorage.setItem(getStorageKey(), String(isCollapsed));
    } catch (error) {
    }
    refreshToggleIcon(isCollapsed);
  }

  function syncMobileSidebar() {
    if (!mobileQuery.matches) return;
    if (!document.querySelector(".admin-sidebar, .employee-sidebar")) return;

    setCollapsed(true);

    const toggle = document.getElementById("sidebarToggle");
    toggle?.addEventListener("click", () => {
      window.setTimeout(() => {
        refreshToggleIcon(document.body.classList.contains("sidebar-collapsed"));
      }, 0);
    });
  }

  window.addEventListener("DOMContentLoaded", syncMobileSidebar);

  mobileQuery.addEventListener?.("change", () => {
    if (mobileQuery.matches) {
      setCollapsed(true);
    }
  });

  document.addEventListener("click", (event) => {
    if (!mobileQuery.matches) return;
    if (document.body.classList.contains("sidebar-collapsed")) return;

    const sidebar = document.querySelector(".admin-sidebar, .employee-sidebar");
    if (!sidebar || sidebar.contains(event.target)) return;

    setCollapsed(true);
  });
})();
