import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Header from "./Header";
import CategoryFilter from "./CategoryFilter";
import MenuItems from "./MenuItems";
import { addItem } from "../utils/pageSlice";
import { BASE_URL } from "../utils/constants";
import { addSearchInfo } from "../utils/menuSlice";

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState(0);

  const dispatch = useDispatch();
  const pageContent = useSelector((store) => store.page);

  // Fetch menu data
  const fetchMenuData = async () => {
    try {
      // If there exists data for the specific page
      if (!pageContent[page]) {
        const result = await axios.get(
          `${BASE_URL}/menu/view/${offset}`,
          { withCredentials: true }
        );
        setMenuItems(result.data);
        setFilteredItems(result.data);

        // Check if page is not zero which is the initial value of page.
        if (page !== 0) {
          const obj = {
            [page]: result.data,
          };
          dispatch(addItem(obj));
        }

        const initialQuantities = {};
        result.data.forEach((item) => {
          initialQuantities[item.name] = 1;
        });

        const uniqueCategories = [
          ...new Set(result.data.map((item) => item.category)),
        ];
        setCategories(uniqueCategories);
      } else {
        setCategories(pageContent[page]);
        setMenuItems(pageContent[page]);
        setFilteredItems(pageContent[page]);

        const initialQuantities = {};
        pageContent[page].forEach((item) => {
          initialQuantities[item.name] = 1;
        });

        const uniqueCategories = [
          ...new Set(pageContent[page].map((item) => item.category)),
        ];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.log(error);
    }
  };

  let debounceTimer;

  useEffect(() => {
    fetchMenuData();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [page]);

  const searchInfo = useSelector((store) => store.menu);

  const handleSearch = async ({ target: { value } }) => {
    if (value === "") {
      setFilteredItems(menuItems);
      return;
    }
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      // Before calling the API, check if data for the current input exists in the store
      const isSearchInfoInStore = searchInfo.some((data) => data[value]);

      if (!isSearchInfoInStore) {
        const result = await axios.get(`${BASE_URL}/menu/search/${value}`, {
          withCredentials: true,
        });
        setFilteredItems(result.data);

        const obj = {
          [value]: result.data,
        };
        dispatch(addSearchInfo(obj));
      } else {
        const filteredSearchInfo = searchInfo[value];
        const items = Object.values(filteredSearchInfo);
        setFilteredItems(items[0]);
      }
    }, 300);
  };

  const handleCategorySelect = (category) => {
    if (category === "All") {
      setFilteredItems(menuItems);
    } else {
      const filtered = menuItems.filter((item) => item.category === category);
      setFilteredItems(filtered);
    }
  };

  return (
    <div>
      <Header />
      <div className="min-h-screen pt-28 pb-16 bg-gray-200">
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          {/* Category Filter */}
          <CategoryFilter
            categories={categories}
            onSearch={handleSearch}
            onCategorySelect={handleCategorySelect}
            setPage={setPage}
            setFilteredItems={setFilteredItems}
          />

          {/* Menu Items */}
          <MenuItems
            items={filteredItems}
            fetchMenuData={fetchMenuData}
            offset={offset}
            setOffset={setOffset}
            setPage={setPage}
          />
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
