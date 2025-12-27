import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Reorder } from "framer-motion";
import { GripVertical } from "lucide-react";
import { updateCompany } from "../controllers/companiesController.js";
import { getAllCompanies } from "../controllers/companiesController.js";
import CompanyCard from "../components/reviews/CompanyCard.jsx";
import CompanyFilters from "../components/reviews/CompanyFilters.jsx";
import Pagination from "../components/reviews/Pagination.jsx";
import CardLoader from "../components/shared/CardLoader.jsx";
import WriteToUsModal from "../components/reviews/WriteToUsModal.jsx";
import RequireAuthModal from "../components/shared/RequireAuthModal.jsx";
import { getUserCookie } from "../utils/cookies.js";
import {
  updateMockMode,
  fetchMockMode,
  syncMockModeFromStorage,
} from "../redux/slices/mockSlice.js";

// Map URL category to actual category value
const categoryMap = {
  broker: "Broker",
  propfirm: "PropFirm",
  crypto: "Crypto",
};

const categoryLabels = {
  Broker: "Brokers",
  PropFirm: "Prop Firms",
  Crypto: "Crypto Exchanges",
};

const categoryDescriptions = {
  Broker:
    "Browse and compare forex and stock brokers. Read authentic reviews and find the best deals.",
  PropFirm:
    "Explore prop trading firms and funding programs. Compare evaluation processes and profit splits.",
  Crypto:
    "Review crypto exchanges and trading platforms. Find secure platforms with competitive fees.",
};

export default function Reviews() {
  const location = useLocation();
  const pathname = location.pathname;
  const dispatch = useDispatch();
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie();
  const userRole =
    typeof user?.role === "string" ? user.role.toLowerCase() : null;
  const canSeePendingCompanies =
    userRole === "admin" || userRole === "operator";
  const isAdmin = userRole === "admin";
  const mockMode = useSelector((state) => state.mock.enabled);
  const [companies, setCompanies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({});
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(0);
  const [totalItems, setTotalItems] = React.useState(0);
  const [writeToUsModalOpen, setWriteToUsModalOpen] = React.useState(false);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  // Extract category from URL pathname
  React.useEffect(() => {
    const pathParts = pathname.split("/");
    const categoryFromPath = pathParts[pathParts.length - 1]; // Get last part of path

    // Check if it's a category route (broker, propfirm, crypto)
    if (
      categoryFromPath &&
      categoryFromPath !== "reviews" &&
      categoryFromPath !== "operator" &&
      !categoryFromPath.startsWith("company")
    ) {
      const mappedCategory = categoryMap[categoryFromPath.toLowerCase()];
      if (mappedCategory) {
        // Set category filter when URL has a category
        setFilters((prev) => {
          // Only update if it's different to avoid infinite loops
          if (prev.category !== mappedCategory) {
            return { ...prev, category: mappedCategory };
          }
          return prev;
        });
      }
    } else if (pathname === "/reviews") {
      // On main reviews page, don't force a category
      // But keep existing filters if user set them manually
    }
  }, [pathname]);

  // Get category from filters
  const activeCategory = filters.category || null;

  // Fetch and sync mock mode from backend (for global sync across all users)
  React.useEffect(() => {
    // Fetch from backend on mount
    dispatch(fetchMockMode());

    // Poll backend periodically to sync mock mode globally (every 5 seconds)
    const pollInterval = setInterval(() => {
      dispatch(fetchMockMode());
    }, 5000);

    // Also listen for localStorage changes (for cross-tab sync on same device)
    const handleStorageChange = (e) => {
      if (e.key === "xk_mock_mode") {
        dispatch(syncMockModeFromStorage());
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [dispatch]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Load companies when dependencies change
  React.useEffect(() => {
    loadCompanies();
  }, [filters, currentPage, itemsPerPage, mockMode]);

  async function loadCompanies() {
    setLoading(true);
    try {
      const response = await getAllCompanies({
        ...filters,
        page: currentPage,
        size: itemsPerPage
      });

      // Handle response structure
      // Controller now sorts out data format and returns { data: [], pagination: {} }
      const companiesData = response.data || [];
      const pagination = response.pagination || {};

      let filtered = canSeePendingCompanies
        ? companiesData
        : companiesData.filter((c) => c.status === "approved");

      // While backend should handle sorting, we might need to apply displayOrder sorting client-side
      // if the backend sort isn't perfect, but ideally backend does it.
      // For now, let's trust the backend order or re-apply sort if needed.
      // Assuming backend handles basic sorting, but we might want to prioritize displayOrder here if mixed.
      // Since it's paginated, sorting MUST be done on backend. 
      // We will assume backend returns sorted data.

      setCompanies(filtered);

      // Update pagination state
      if (pagination.totalPages) setTotalPages(pagination.totalPages);
      else if (pagination.totalItems) setTotalPages(Math.ceil(pagination.totalItems / itemsPerPage));
      else setTotalPages(1); // Fallback

      if (pagination.totalItems) setTotalItems(pagination.totalItems);
      else setTotalItems(filtered.length); // Fallback (likely only works for small sets)

    } catch (error) {
      console.error("Error loading companies:", error);
      setCompanies([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  function handlePageChange(page) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleItemsPerPageChange(items) {
    setItemsPerPage(items);
    setCurrentPage(1);
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const pageTitle = activeCategory
    ? `${categoryLabels[activeCategory]} Reviews | XK Trading Floor`
    : "Company Reviews | XK Trading Floor";

  const heroTitle = activeCategory
    ? `Compare ${categoryLabels[activeCategory]}`
    : "Compare Trading Companies";

  const heroDescription = activeCategory
    ? categoryDescriptions[activeCategory]
    : "Browse brokers, prop firms, and crypto exchanges. Read authentic reviews from traders and find the best deals with promo codes.";

  // Handle drag-and-drop reordering within the current page (admin only)
  const handleReorderCompanies = async (newPageCompanies) => {
    setCompanies(newPageCompanies);

    // setAllCompanies logic removed as we use server-side pagination now

    // Persist ordering to backend (and mock store) using displayOrder
    try {
      const reorderedPage = newPageCompanies;
      const baseIndex = (currentPage - 1) * itemsPerPage;

      await Promise.all(
        reorderedPage.map((company, idx) => {
          const id = company.id || company._id;
          if (!id) return Promise.resolve();
          const displayOrder = baseIndex + idx;
          return updateCompany(id, { displayOrder });
        })
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to persist company display order:", error);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={heroDescription} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black">
        {/* <section className="relative overflow-hidden bg-gradient-to-b from-green-500/10 via-transparent to-transparent"> */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 text-center">
          <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl mb-3">
            {activeCategory ? (
              <>
                Compare{" "}
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
                  {categoryLabels[activeCategory]}
                </span>
              </>
            ) : (
              <>
                Compare{" "}
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
                  Trading Companies
                </span>
              </>
            )}
          </h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
            {heroDescription}
          </p>
        </div>
      </section>

      {/* Mock Data Toggle - HIDDEN FOR NOW (can be enabled later) */}
      {false && isAdmin && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-end gap-4">
            {/* Modern Mock Data Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-800/50 border border-white/10">
              <span className="text-sm font-medium text-gray-300 whitespace-nowrap">
                Mock Data
              </span>
              <button
                type="button"
                onClick={() => dispatch(updateMockMode(!mockMode))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${mockMode ? "bg-blue-600" : "bg-gray-600"
                  }`}
                role="switch"
                aria-checked={mockMode}
                aria-label="Toggle mock data mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mockMode ? "translate-x-6" : "translate-x-1"
                    }`}
                />
              </button>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {mockMode ? "ON" : "OFF"}
              </span>
            </div>
            <Link to="/admin/companies/create" className="btn btn-primary">
              + Add Company
            </Link>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-end gap-4">
            <Link to="/admin/companies" className="btn btn-secondary">
              Manage Companies
            </Link>
            <Link to="/admin/companies/create" className="btn btn-primary">
              + Add Company
            </Link>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <CompanyFilters filters={filters} onChange={setFilters} />
          </div>

          {/* Companies List */}
          <div className="lg:col-span-3">
            {loading ? (
              <CardLoader count={3} horizontal={true} />
            ) : companies.length === 0 ? (
              <div className="card">
                <div className="card-body text-center py-12">
                  <div className="text-gray-400 mb-4">
                    No companies found matching your filters.
                  </div>
                  <button
                    onClick={() => setFilters({})}
                    className="btn btn-secondary"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Showing {startIndex + 1}-{endIndex} of {totalItems}{" "}
                    {totalItems === 1 ? "company" : "companies"}
                  </div>
                </div>
                {isAdmin ? (
                  <Reorder.Group
                    axis="y"
                    values={companies}
                    onReorder={handleReorderCompanies}
                    className="space-y-4"
                  >
                    {companies.map((company) => (
                      <Reorder.Item
                        key={company.id || company._id}
                        value={company}
                        className="flex items-stretch gap-3"
                      >
                        <button
                          type="button"
                          className="mt-4 h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full border border-gray-700 bg-gray-800/70 text-gray-400 cursor-grab active:cursor-grabbing"
                          aria-label="Drag to reorder company"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <div className="flex-1">
                          <CompanyCard company={company} user={user} />
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                ) : (
                  <div className="space-y-4">
                    {companies.map((company) => (
                      <CompanyCard
                        key={company.id || company._id}
                        company={company}
                        user={user}
                      />
                    ))}
                  </div>
                )}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                )}
                {/* Write to Us Option */}
                <div className="card mt-6 border-2 border-dashed border-gray-700 hover:border-blue-500/50 transition-colors">
                  <div className="card-body text-center py-8">
                    <div className="text-gray-400 mb-4">
                      Didn't find your broker, propfirm or crypto?
                    </div>
                    <p className="text-gray-300 mb-6">
                      Write to us and get it added to our platform.
                    </p>
                    <button
                      onClick={() => {
                        if (user) {
                          setWriteToUsModalOpen(true);
                        } else {
                          setAuthModalOpen(true);
                        }
                      }}
                      className="btn btn-primary inline-flex items-center gap-2"
                      aria-disabled={!user}
                      title={
                        !user
                          ? "Login required to request company addition"
                          : ""
                      }
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Request Company Addition
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <WriteToUsModal
        isOpen={writeToUsModalOpen}
        onClose={() => setWriteToUsModalOpen(false)}
        onSubmit={(data) => {
          console.log("Submitted:", data);
        }}
      />
      <RequireAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onConfirm={() => {
          const nextPath = "/reviews";
          window.location.href = `/login?next=${encodeURIComponent(nextPath)}`;
        }}
      />
    </div>
  );
}
