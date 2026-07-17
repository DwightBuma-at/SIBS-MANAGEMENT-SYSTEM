function readCollection(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function readCurrentEmployee() {
  try {
    const value = JSON.parse(localStorage.getItem("sibsCurrentEmployee") || "null");
    if (!value || !value.email) return null;

    const employees = readCollection("sibsEmployees");
    const registeredEmployee = employees.find((employee) => {
      return (employee.email || "").trim().toLowerCase() === value.email.trim().toLowerCase();
    });

    if (!registeredEmployee) {
      localStorage.removeItem("sibsCurrentEmployee");
      return null;
    }

    return {
      fullName: registeredEmployee.fullName || value.fullName,
      email: registeredEmployee.email || value.email,
      position: registeredEmployee.position || value.position
    };
  } catch (error) {
    return null;
  }
}

function formatDateTime(value) {
  if (!value) return "No date set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date set";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatEventDate(dateValue, timeValue) {
  const date = new Date(`${dateValue || ""}T${timeValue || "00:00"}`);
  if (Number.isNaN(date.getTime())) return "No date set";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function renderEmpty(target, message) {
  target.innerHTML = `<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">${message}</div>`;
}

function initializeEmployeeShell() {
  const employee = readCurrentEmployee();

  if (!employee) {
    window.location.href = "index.html";
    return null;
  }

  document.querySelectorAll("[data-employee-name]").forEach((target) => {
    target.textContent = employee.fullName || "Employee";
  });

  document.querySelectorAll("[data-employee-position]").forEach((target) => {
    target.textContent = employee.position || "Employee";
  });

  if (window.lucide) {
    lucide.createIcons();
  }

  const sidebarToggle = document.getElementById("sidebarToggle");

  function refreshSidebarToggleIcon(isCollapsed) {
    if (!sidebarToggle) return;
    sidebarToggle.innerHTML = isCollapsed
      ? '<i data-lucide="panel-left-open" class="h-5 w-5"></i>'
      : '<i data-lucide="panel-left-close" class="h-5 w-5"></i>';
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  function setSidebarCollapsed(isCollapsed) {
    document.body.classList.toggle("sidebar-collapsed", isCollapsed);
    refreshSidebarToggleIcon(isCollapsed);
  }

  let savedSidebarState = false;
  try {
    savedSidebarState = localStorage.getItem("sibsEmployeeSidebarCollapsed") === "true";
  } catch (error) {
    savedSidebarState = false;
  }

  setSidebarCollapsed(savedSidebarState);

  sidebarToggle?.addEventListener("click", () => {
    const isCollapsed = !document.body.classList.contains("sidebar-collapsed");
    try {
      localStorage.setItem("sibsEmployeeSidebarCollapsed", String(isCollapsed));
    } catch (error) {
    }
    setSidebarCollapsed(isCollapsed);
  });

  const logoutModal = document.getElementById("logoutModal");
  const cancelLogout = document.getElementById("cancelLogout");
  const confirmLogout = document.getElementById("confirmLogout");

  function closeLogoutModal() {
    logoutModal.classList.add("hidden");
    logoutModal.classList.remove("flex");
  }

  document.querySelectorAll("[data-logout-open]").forEach((button) => {
    button.addEventListener("click", () => {
      logoutModal.classList.remove("hidden");
      logoutModal.classList.add("flex");
      cancelLogout.focus();
    });
  });

  cancelLogout.addEventListener("click", closeLogoutModal);
  confirmLogout.addEventListener("click", () => {
    localStorage.removeItem("sibsCurrentEmployee");
    window.location.href = "index.html";
  });

  logoutModal.addEventListener("click", (event) => {
    if (event.target === logoutModal) {
      closeLogoutModal();
    }
  });

  return employee;
}

function renderEmployeeDashboard() {
  const employee = initializeEmployeeShell();
  if (!employee) return;

  const announcements = readCollection("sibsAnnouncements").sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  const events = readCollection("sibsEvents").sort((a, b) => new Date(`${a.date || ""}T${a.time || "00:00"}`) - new Date(`${b.date || ""}T${b.time || "00:00"}`));

  document.getElementById("employeeAnnouncementCount").textContent = announcements.length;
  document.getElementById("employeeEventCount").textContent = events.length;
  document.getElementById("employeeNextEvent").textContent = events[0] ? formatEventDate(events[0].date, events[0].time) : "No event posted yet";

  const announcementList = document.getElementById("employeeRecentAnnouncements");
  if (!announcements.length) {
    renderEmpty(announcementList, "No announcements have been posted yet.");
  } else {
    announcementList.innerHTML = announcements.slice(0, 3).map((item) => `
      <article class="rounded-xl border border-slate-100 bg-white px-4 py-3">
        <p class="post-content text-sm font-medium text-slate-950">${item.title || "Announcement"}</p>
        <p class="mt-1 text-xs text-slate-500">${formatDateTime(item.updatedAt || item.createdAt)}</p>
        <p class="post-content mt-2 line-clamp-2 text-sm text-slate-600">${item.content || ""}</p>
      </article>
    `).join("");
  }

  const eventList = document.getElementById("employeeRecentEvents");
  if (!events.length) {
    renderEmpty(eventList, "No upcoming events have been posted yet.");
  } else {
    eventList.innerHTML = events.slice(0, 3).map((item) => `
      <article class="rounded-xl border border-slate-100 bg-white px-4 py-3">
        <p class="post-content text-sm font-medium text-slate-950">${item.title || "Untitled Event"}</p>
        <p class="mt-1 text-xs text-[#075d63]">${formatEventDate(item.date, item.time)}</p>
        <p class="post-content mt-2 text-sm text-slate-600">${item.location || "No location set"}</p>
      </article>
    `).join("");
  }
}

function renderEmployeeEvents() {
  const employee = initializeEmployeeShell();
  if (!employee) return;

  const target = document.getElementById("employeeEventList");
  const events = readCollection("sibsEvents").sort((a, b) => new Date(`${a.date || ""}T${a.time || "00:00"}`) - new Date(`${b.date || ""}T${b.time || "00:00"}`));

  if (!events.length) {
    renderEmpty(target, "No upcoming events have been posted by admin yet.");
    return;
  }

  target.innerHTML = events.map((item) => `
    <article class="employee-card min-w-0 p-5">
      <div class="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div class="min-w-0 space-y-4">
          <div>
            <p class="text-[11px] font-medium uppercase text-slate-400">What</p>
            <h2 class="post-content mt-1 text-lg font-medium text-slate-950">${item.title || "Untitled Event"}</h2>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-[11px] font-medium uppercase text-slate-400">When</p>
              <p class="mt-1 flex items-center gap-2 text-sm text-[#075d63]"><i data-lucide="calendar-clock" class="h-4 w-4"></i>${formatEventDate(item.date, item.time)}</p>
            </div>
            <div>
              <p class="text-[11px] font-medium uppercase text-slate-400">Where</p>
              <p class="post-content mt-1 flex items-center gap-2 text-sm text-slate-600"><i data-lucide="map-pin" class="h-4 w-4"></i>${item.location || "No location set"}</p>
            </div>
          </div>
          <div>
            <p class="text-[11px] font-medium uppercase text-slate-400">Description</p>
            <p class="post-content mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">${item.details || "No event details provided."}</p>
          </div>
        </div>
        <span class="w-fit rounded-lg bg-[#e8f2f2] px-3 py-1 text-xs font-medium text-[#075d63]">Upcoming</span>
      </div>
    </article>
  `).join("");

  if (window.lucide) {
    lucide.createIcons();
  }
}

function renderEmployeeAnnouncements() {
  const employee = initializeEmployeeShell();
  if (!employee) return;

  const target = document.getElementById("employeeAnnouncementList");
  const announcements = readCollection("sibsAnnouncements").sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

  if (!announcements.length) {
    renderEmpty(target, "No announcements have been posted by admin yet.");
    return;
  }

  target.innerHTML = announcements.map((item) => `
    <article class="employee-card min-w-0 p-5">
      <div class="flex min-w-0 gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white p-2">
          <img src="https://sibscontactcenter.com/hubfs/Logo/SiBS-logo.svg" alt="SiBS logo" class="h-5 w-auto" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-950">Admin</p>
              <p class="text-xs text-slate-500">${formatDateTime(item.updatedAt || item.createdAt)}</p>
            </div>
            <span class="rounded-lg bg-[#e8f2f2] px-3 py-1 text-xs font-medium text-[#075d63]">Announcement</span>
          </div>
          <h2 class="post-content mt-4 text-lg font-medium text-slate-950">${item.title || "Announcement"}</h2>
          <p class="post-content mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">${item.content || ""}</p>
        </div>
      </div>
    </article>
  `).join("");
}
