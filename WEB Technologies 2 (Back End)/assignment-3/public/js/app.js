let currentPage = 1;
let totalPages = 1;
let currentSort = "-createdAt";
let currentSearch = "";
let editingBlogId = null;

const API_URL = "/api/blogs";

const blogForm = document.getElementById("blogForm");
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const bodyInput = document.getElementById("body");
const blogsContainer = document.getElementById("blogsContainer");
const loading = document.getElementById("loading");
const noBlogs = document.getElementById("noBlogs");
const searchInput = document.getElementById("searchInput");
const sortBy = document.getElementById("sortBy");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const pagination = document.getElementById("pagination");
const refreshBtn = document.getElementById("refreshBtn");
const clearSearchBtn = document.getElementById("clearSearch");
const cancelBtn = document.getElementById("cancelBtn");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const bodyCharCount = document.getElementById("bodyCharCount");
const totalBlogsEl = document.getElementById("totalBlogs");
const totalAuthorsEl = document.getElementById("totalAuthors");

// Modal elements
const blogModal = document.getElementById("blogModal");
const modalTitle = document.getElementById("modalTitle");
const modalAuthor = document.getElementById("modalAuthor");
const modalDate = document.getElementById("modalDate");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const modalEditBtn = document.getElementById("modalEditBtn");
const modalDeleteBtn = document.getElementById("modalDeleteBtn");

// Toast element
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

// ============================================
// Initialize Application
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  loadBlogs();
  loadStats();
  setupEventListeners();
});

function setupEventListeners() {
  blogForm.addEventListener("submit", handleFormSubmit);

  searchInput.addEventListener("input", debounce(handleSearch, 500));
  clearSearchBtn.addEventListener("click", clearSearch);

  sortBy.addEventListener("change", handleSort);

  prevPageBtn.addEventListener("click", () => changePage(currentPage - 1));
  nextPageBtn.addEventListener("click", () => changePage(currentPage + 1));

  refreshBtn.addEventListener("click", () => {
    showToast("Refreshing...", "info");
    loadBlogs();
    loadStats();
  });

  cancelBtn.addEventListener("click", cancelEdit);

  bodyInput.addEventListener("input", updateCharCount);

  modalClose.addEventListener("click", closeModal);
  blogModal.addEventListener("click", (e) => {
    if (e.target === blogModal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      if (editingBlogId) {
        cancelEdit();
      }
    }
  });
}

async function loadBlogs() {
  try {
    showLoading(true);

    const params = new URLSearchParams({
      page: currentPage,
      limit: 10,
      sort: currentSort,
    });

    if (currentSearch) {
      params.append("search", currentSearch);
    }

    const response = await fetch(`${API_URL}?${params}`);
    const data = await response.json();

    if (data.success) {
      displayBlogs(data.data);
      updatePagination(data.currentPage, data.totalPages, data.total);
    } else {
      showToast("Failed to load blogs", "error");
    }
  } catch (error) {
    console.error("Error loading blogs:", error);
    showToast("Error loading blogs", "error");
  } finally {
    showLoading(false);
  }
}

async function loadStats() {
  try {
    const response = await fetch(`${API_URL}/stats`);
    const data = await response.json();

    if (data.success) {
      totalBlogsEl.textContent = data.data.totalBlogs;
      totalAuthorsEl.textContent = data.data.blogsByAuthor.length;
    }
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

async function saveBlog(blogData) {
  try {
    const url = editingBlogId ? `${API_URL}/${editingBlogId}` : API_URL;
    const method = editingBlogId ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(blogData),
    });

    const data = await response.json();

    if (data.success) {
      showToast(
        editingBlogId
          ? "Blog updated successfully!"
          : "Blog created successfully!",
        "success",
      );
      blogForm.reset();
      cancelEdit();
      loadBlogs();
      loadStats();
      updateCharCount();
    } else {
      if (data.errors) {
        displayValidationErrors(data.errors);
      } else {
        showToast(data.message || "Failed to save blog", "error");
      }
    }
  } catch (error) {
    console.error("Error saving blog:", error);
    showToast("Error saving blog", "error");
  }
}

async function deleteBlog(id) {
  if (!confirm("Are you sure you want to delete this blog post?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.success) {
      showToast("Blog deleted successfully!", "success");
      closeModal();
      loadBlogs();
      loadStats();
    } else {
      showToast(data.message || "Failed to delete blog", "error");
    }
  } catch (error) {
    console.error("Error deleting blog:", error);
    showToast("Error deleting blog", "error");
  }
}

async function getBlogById(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      showToast(data.message || "Failed to load blog", "error");
      return null;
    }
  } catch (error) {
    console.error("Error fetching blog:", error);
    showToast("Error fetching blog", "error");
    return null;
  }
}

function displayBlogs(blogs) {
  blogsContainer.innerHTML = "";

  if (blogs.length === 0) {
    noBlogs.style.display = "block";
    pagination.style.display = "none";
    return;
  }

  noBlogs.style.display = "none";
  pagination.style.display = "flex";

  blogs.forEach((blog) => {
    const blogCard = createBlogCard(blog);
    blogsContainer.appendChild(blogCard);
  });
}

function createBlogCard(blog) {
  const card = document.createElement("div");
  card.className = "blog-card";
  card.setAttribute("data-id", blog._id);

  const createdDate = formatDate(blog.createdAt);
  const excerpt =
    blog.body.length > 150 ? blog.body.substring(0, 150) + "..." : blog.body;

  card.innerHTML = `
        <div class="blog-card-header">
            <h3 class="blog-card-title">${escapeHtml(blog.title)}</h3>
            <div class="blog-card-meta">
                <span>
                    <i class="fas fa-user"></i>
                    ${escapeHtml(blog.author)}
                </span>
                <span>
                    <i class="fas fa-calendar"></i>
                    ${createdDate}
                </span>
            </div>
        </div>
        <div class="blog-card-body">
            <p class="blog-card-excerpt">${escapeHtml(excerpt)}</p>
        </div>
        <div class="blog-card-actions">
            <button class="btn-sm btn-view" onclick="viewBlog('${blog._id}')">
                <i class="fas fa-eye"></i> View
            </button>
            <button class="btn-sm btn-edit" onclick="editBlog('${blog._id}')">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn-sm btn-delete" onclick="deleteBlog('${blog._id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;

  return card;
}

// Update pagination controls
function updatePagination(current, total, totalCount) {
  currentPage = current;
  totalPages = total;

  pageInfo.textContent = `Page ${current} of ${total}`;

  prevPageBtn.disabled = current <= 1;
  nextPageBtn.disabled = current >= total;

  if (total <= 1) {
    pagination.style.display = "none";
  } else {
    pagination.style.display = "flex";
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  clearValidationErrors();

  const blogData = {
    title: titleInput.value.trim(),
    body: bodyInput.value.trim(),
    author: authorInput.value.trim() || "Anonymous",
  };

  let hasErrors = false;

  if (blogData.title.length < 3) {
    showFieldError("title", "Title must be at least 3 characters long");
    hasErrors = true;
  }

  if (blogData.body.length < 10) {
    showFieldError("body", "Body must be at least 10 characters long");
    hasErrors = true;
  }

  if (hasErrors) {
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  await saveBlog(blogData);

  submitBtn.disabled = false;
  submitBtn.innerHTML = editingBlogId
    ? '<i class="fas fa-save"></i> Update Post'
    : '<i class="fas fa-save"></i> Create Post';
}

function showFieldError(fieldName, message) {
  const errorEl = document.getElementById(`${fieldName}Error`);
  if (errorEl) {
    errorEl.textContent = message;
  }
  const inputEl = document.getElementById(fieldName);
  if (inputEl) {
    inputEl.style.borderColor = "var(--danger-color)";
  }
}

function clearValidationErrors() {
  const errorElements = document.querySelectorAll(".error-message");
  errorElements.forEach((el) => (el.textContent = ""));

  const inputs = document.querySelectorAll(
    ".form-group input, .form-group textarea",
  );
  inputs.forEach((input) => (input.style.borderColor = ""));
}

function displayValidationErrors(errors) {
  errors.forEach((error) => {
    const fieldName = error.path || error.param;
    if (fieldName) {
      showFieldError(fieldName, error.msg || error.message);
    }
  });
}

function updateCharCount() {
  const count = bodyInput.value.length;
  bodyCharCount.textContent = count;
}

async function viewBlog(id) {
  const blog = await getBlogById(id);
  if (!blog) return;

  modalTitle.textContent = blog.title;
  modalAuthor.textContent = blog.author;
  modalDate.textContent = formatDate(blog.createdAt);
  modalBody.textContent = blog.body;

  modalEditBtn.onclick = () => {
    closeModal();
    editBlog(id);
  };
  modalDeleteBtn.onclick = () => deleteBlog(id);

  openModal();
}

async function editBlog(id) {
  const blog = await getBlogById(id);
  if (!blog) return;

  editingBlogId = id;
  titleInput.value = blog.title;
  authorInput.value = blog.author;
  bodyInput.value = blog.body;

  formTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Blog Post';
  submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Post';
  cancelBtn.style.display = "inline-flex";

  blogForm.scrollIntoView({ behavior: "smooth", block: "start" });
  titleInput.focus();

  updateCharCount();
}

function cancelEdit() {
  editingBlogId = null;
  blogForm.reset();
  formTitle.innerHTML =
    '<i class="fas fa-plus-circle"></i> Create New Blog Post';
  submitBtn.innerHTML = '<i class="fas fa-save"></i> Create Post';
  cancelBtn.style.display = "none";
  clearValidationErrors();
  updateCharCount();
}

function handleSearch(e) {
  currentSearch = e.target.value.trim();
  currentPage = 1;

  if (currentSearch) {
    clearSearchBtn.style.display = "block";
  } else {
    clearSearchBtn.style.display = "none";
  }

  loadBlogs();
}

function clearSearch() {
  searchInput.value = "";
  currentSearch = "";
  clearSearchBtn.style.display = "none";
  currentPage = 1;
  loadBlogs();
}

function handleSort(e) {
  currentSort = e.target.value;
  currentPage = 1;
  loadBlogs();
}

function changePage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  loadBlogs();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openModal() {
  blogModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  blogModal.classList.remove("active");
  document.body.style.overflow = "";
}

function showLoading(show) {
  loading.style.display = show ? "block" : "none";
  blogsContainer.style.display = show ? "none" : "grid";
}

function showToast(message, type = "success") {
  toastMessage.textContent = message;
  toast.className = `toast ${type}`;

  const icon = toast.querySelector("i");
  switch (type) {
    case "success":
      icon.className = "fas fa-check-circle";
      break;
    case "error":
      icon.className = "fas fa-exclamation-circle";
      break;
    case "warning":
      icon.className = "fas fa-exclamation-triangle";
      break;
    case "info":
      icon.className = "fas fa-info-circle";
      break;
  }

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("en-US", options);
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

window.viewBlog = viewBlog;
window.editBlog = editBlog;
window.deleteBlog = deleteBlog;
