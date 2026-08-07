import React from "react";
import Seo from "../components/shared/Seo.jsx";
import { useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Reorder } from "framer-motion";
import { GripVertical } from "lucide-react";
import { updateCompany } from "../controllers/companiesController.js";
import { getAllCompanies } from "../controllers/companiesController.js";
import { getReviewsByCompanyId } from "../controllers/reviewsController.js";
import CompanyCard from "../components/reviews/CompanyCard.jsx";
import CompanyFiltersBar from "../components/reviews/CompanyFiltersBar.jsx";
import ReviewsPageHero from "../components/reviews/ReviewsPageHero.jsx";
import ReviewsSidebar from "../components/reviews/ReviewsSidebar.jsx";
import ReviewsTabs from "../components/reviews/ReviewsTabs.jsx";
import Pagination from "../components/reviews/Pagination.jsx";
import CardLoader from "../components/shared/CardLoader.jsx";
import WriteToUsModal from "../components/reviews/WriteToUsModal.jsx";
import RequireAuthModal from "../components/shared/RequireAuthModal.jsx";
import { getUserCookie } from "../utils/cookies.js";
import { computeTrustScore } from "../utils/trustScore.js";

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

function sortCompanies(companies, sortBy) {
  const sorted = [...companies];

  switch (sortBy) {
    case "rating":
      return sorted.sort((a, b) => (b.ratingsAggregate || 0) - (a.ratingsAggregate || 0));
    case "reviews":
      return sorted.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0));
    case "name":
      return sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    case "trustScore":
    default:
      return sorted.sort((a, b) => {
        const scoreA = computeTrustScore(a.ratingsAggregate, a.totalReviews).score;
        const scoreB = computeTrustScore(b.ratingsAggregate, b.totalReviews).score;
        return scoreB - scoreA;
      });
  }
}

export default function Reviews() {
  const location = useLocation();
  const pathname = location.pathname;
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie();
  const userRole =
    typeof user?.role === "string" ? user.role.toLowerCase() : null;
  const canSeePendingCompanies =
    userRole === "admin" || userRole === "operator";
  const isAdmin = userRole === "admin";
  const [companies, setCompanies] = React.useState([]);
  const [sidebarBrokers, setSidebarBrokers] = React.useState([]);
  const [sidebarPropFirms, setSidebarPropFirms] = React.useState([]);
  const [latestReviews, setLatestReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({ sortBy: "trustScore" });
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(0);
  const [totalItems, setTotalItems] = React.useState(0);
  const [writeToUsModalOpen, setWriteToUsModalOpen] = React.useState(false);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);

  React.useEffect(() => {
    const pathParts = pathname.split("/");
    const categoryFromPath = pathParts[pathParts.length - 1];

    if (
      categoryFromPath &&
      categoryFromPath !== "reviews" &&
      categoryFromPath !== "operator" &&
      categoryFromPath !== "traders" &&
      !categoryFromPath.startsWith("company")
    ) {
      const mappedCategory = categoryMap[categoryFromPath.toLowerCase()];
      if (mappedCategory) {
        setFilters((prev) => {
          if (prev.category !== mappedCategory) {
            return { ...prev, category: mappedCategory };
          }
          return prev;
        });
      }
    }
  }, [pathname]);

  const activeCategory = filters.category || null;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  React.useEffect(() => {
    loadCompanies();
  }, [filters, currentPage, itemsPerPage]);

  React.useEffect(() => {
    loadSidebarData();
  }, []);

  async function loadSidebarData() {
    try {
      const [brokersRes, propFirmsRes] = await Promise.all([
        getAllCompanies({ category: "Broker", size: 10 }),
        getAllCompanies({ category: "PropFirm", size: 10 }),
      ]);

      const brokers = (brokersRes.data || []).filter((c) => c.status === "approved");
      const propFirms = (propFirmsRes.data || []).filter((c) => c.status === "approved");

      setSidebarBrokers(sortCompanies(brokers, "trustScore"));
      setSidebarPropFirms(sortCompanies(propFirms, "trustScore"));

      const topCompanies = [...brokers.slice(0, 2), ...propFirms.slice(0, 2)];
      const reviewResults = await Promise.allSettled(
        topCompanies.map(async (company) => {
          const id = company.id || company._id;
          const reviews = await getReviewsByCompanyId(id);
          const list = reviews?.data || reviews || [];
          return list.slice(0, 2).map((r) => ({
            ...r,
            companyName: company.name,
            companyId: id,
          }));
        })
      );

      const allReviews = reviewResults
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setLatestReviews(allReviews);
    } catch (error) {
      console.error("Error loading sidebar data:", error);
    }
  }

  async function loadCompanies() {
    setLoading(true);
    try {
      // Fetch the WHOLE category slice, not just the current page. The old
      // code paginated at the server and then sorted/filtered the resulting
      // 10-item page in JS — so "Sort by Trust Score" only reordered a
      // random 10 rows and "Showing X of N" disagreed with what was on
      // screen once minRating filtered any of them out. The dataset is
      // O(dozens) per category so pulling everything and sorting/filtering
      // client-side is both correct and cheap.
      const { category, search } = filters;
      const response = await getAllCompanies({
        ...(category ? { category } : {}),
        ...(search ? { search } : {}),
        page: 1,
        size: 500,
      });

      const raw = response.data || [];

      let filtered = canSeePendingCompanies
        ? raw
        : raw.filter((c) => c.status === "approved");

      if (filters.minRating) {
        filtered = filtered.filter(
          (c) => (c.ratingsAggregate || 0) >= filters.minRating
        );
      }

      filtered = sortCompanies(filtered, filters.sortBy || "trustScore");

      // Counters reflect the fully filtered+sorted set — no more mismatch.
      const total = filtered.length;
      const pages = Math.max(1, Math.ceil(total / itemsPerPage));
      const safePage = Math.min(currentPage, pages);
      const start = (safePage - 1) * itemsPerPage;
      const pageSlice = filtered.slice(start, start + itemsPerPage);

      setCompanies(pageSlice);
      setTotalItems(total);
      setTotalPages(pages);
      // If a filter change dropped rows past the current page, snap back.
      if (safePage !== currentPage) setCurrentPage(safePage);
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

  function handleSearchChange(value) {
    setFilters((prev) => ({ ...prev, search: value }));
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const pageTitle = activeCategory
    ? `${categoryLabels[activeCategory]} Reviews | XK Trading Floor`
    : "Company Reviews | XK Trading Floor";

  const heroDescription = activeCategory
    ? categoryDescriptions[activeCategory]
    : "Browse brokers, prop firms, and crypto exchanges. Read authentic reviews from traders and find the best deals with promo codes.";

  const handleReorderCompanies = async (newPageCompanies) => {
    setCompanies(newPageCompanies);

    try {
      const baseIndex = (currentPage - 1) * itemsPerPage;
      await Promise.all(
        newPageCompanies.map((company, idx) => {
          const id = company.id || company._id;
          if (!id) return Promise.resolve();
          return updateCompany(id, { displayOrder: baseIndex + idx });
        })
      );
    } catch (error) {
      console.error("Failed to persist company display order:", error);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <Seo
        title={pageTitle.replace(" | XK Trading Floor", "")}
        description={heroDescription}
        path="/reviews"
      />

      <ReviewsPageHero
        searchValue={filters.search}
        onSearchChange={handleSearchChange}
        onSearchSubmit={() => setCurrentPage(1)}
      />

      <ReviewsTabs />

      {isAdmin && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-end gap-4">
            <Link
              to="/admin/companies"
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md text-white/90 text-sm font-medium shadow-sm hover:bg-white/10 hover:border-white/20 hover:text-white hover:scale-105 hover:shadow-blue-500/10 transition-all duration-300"
            >
              <span className="relative z-10">Manage Companies</span>
            </Link>
            <Link to="/admin/companies/create" className="btn btn-primary">
              + Add Company
            </Link>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Filters */}
        <div className="mb-6">
          <CompanyFiltersBar filters={filters} onChange={setFilters} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content — Company Cards */}
          <div className="xl:col-span-3">
            {loading ? (
              <CardLoader count={3} horizontal={true} />
            ) : companies.length === 0 ? (
              <div className="card">
                <div className="card-body text-center py-12">
                  <div className="text-gray-400 mb-4">
                    No companies found matching your filters.
                  </div>
                  <button
                    onClick={() => setFilters({ sortBy: "trustScore" })}
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
                    >
                      Request Company Addition
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="xl:col-span-1">
            <div className="sticky top-24">
              <ReviewsSidebar
                brokers={sidebarBrokers}
                propFirms={sidebarPropFirms}
                latestReviews={latestReviews}
              />
            </div>
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
          window.location.href = `/login?next=${encodeURIComponent("/reviews")}`;
        }}
      />
    </div>
  );
}
