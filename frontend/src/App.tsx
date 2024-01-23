import { FormEvent, useEffect, useRef, useState } from "react";
import "./App.css";
import * as api from "./api";
import { Recipe } from "./types";
import RecipeCard from "./components/RecipeCard";
import RecipeModal from "./components/RecipeModal";
import { AiOutlineSearch } from "react-icons/ai";

type Tabs = "home" | "favourites";

const App = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | undefined>(
    undefined
  );
  const [selectedTab, setSelectedTab] = useState<Tabs>("home");
  const [favouriteRecipes, setFavouriteRecipes] = useState<Recipe[]>([]);
  const [randomRecipes, setRandomRecipes] = useState<Recipe[]>([]);
  const [forceUpdate, setForceUpdate] = useState(false);

  const pageNumber = useRef(1);

  useEffect(() => {
    const fetchFavouriteRecipes = async () => {
      try {
        const favouriteRecipes = await api.getFavouriteRecipes();
        setFavouriteRecipes(favouriteRecipes.results);
      } catch (error) {
        console.log(error);
      }
    };

    fetchFavouriteRecipes();
  }, []);

  useEffect(() => {
    const fetchRandomRecipes = async () => {
      try {
        const randomRecipesResponse = await api.getRandom(10);
        if (randomRecipesResponse && randomRecipesResponse.recipes) {
          setRandomRecipes(randomRecipesResponse.recipes);
        } else {
          console.error(
            "Error fetching random recipes:",
            randomRecipesResponse
          );
        }
      } catch (error) {
        console.error("Error fetching random recipes:", error);
      }
    };

    if (selectedTab === "home") {
      // Fetch random recipes only when "home" tab is selected
      fetchRandomRecipes();
    }
  }, [selectedTab]);
  console.log("Component re-rendered");

  const handleViewMore = async () => {
    const nextPage = pageNumber.current + 1;
    try {
      const nextRecipes = await api.searchRecipes(searchTerm, nextPage);
      setRecipes((prevRecipes) => [...prevRecipes, ...nextRecipes.results]);
      pageNumber.current = nextPage;
      console.log("Recipes after View More:", recipes);
    } catch (error) {
      console.error("Error fetching more recipes:", error);
    }
  };

  const handleSearchSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const newRecipes = await api.searchRecipes(searchTerm, 1);
      setRecipes(newRecipes.results);
      pageNumber.current = 1;
      setForceUpdate((prevState) => !prevState);
    } catch (e) {
      console.error("Error searching recipes:", e);
    }
  };

  const addFavouriteRecipe = async (recipe: Recipe) => {
    try {
      await api.addFavouriteRecipe(recipe);
      setFavouriteRecipes([...favouriteRecipes, recipe]);
    } catch (error) {
      console.log(error);
    }
  };

  const removeFavouriteRecipe = async (recipe: Recipe) => {
    try {
      await api.removeFavouriteRecipe(recipe);
      const updatedRecipes = favouriteRecipes.filter(
        (favRecipe) => recipe.id !== favRecipe.id
      );

      setFavouriteRecipes(updatedRecipes);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <img src="/banner.jpg" />
        <div className="title">RecipeHero</div>
      </div>
      <div className="tabs">
        <h1
          className={selectedTab === "home" ? "tab-active" : ""}
          onClick={() => setSelectedTab("home")}
        >
          {" "}
          Home{" "}
        </h1>
        <h1
          className={selectedTab === "favourites" ? "tab-active" : ""}
          onClick={() => setSelectedTab("favourites")}
        >
          {" "}
          Favourites{" "}
        </h1>
      </div>
      {selectedTab === "home" && (
        <>
          <form onSubmit={(event) => handleSearchSubmit(event)}>
            <input
              type="text"
              required
              placeholder="Search a recipe"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            ></input>
            <button type="submit">
              <AiOutlineSearch size={40} />
            </button>
          </form>

          <div className="recipe-grid">
            {randomRecipes.map((recipe) => {
              const isFavourite = favouriteRecipes.some(
                (favRecipe) => recipe.id === favRecipe.id
              );

              return (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => setSelectedRecipe(recipe)}
                  onFavouriteButtonClick={
                    isFavourite ? removeFavouriteRecipe : addFavouriteRecipe
                  }
                  isFavourite={isFavourite}
                />
              );
            })}
          </div>
          <button className="view-more-btn" onClick={handleViewMore}>
            View More
          </button>
        </>
      )}

      {selectedTab === "favourites" && (
        <div className="recipe-grid">
          {favouriteRecipes.map((recipe) => (
            <RecipeCard
              recipe={recipe}
              onClick={() => setSelectedRecipe(recipe)}
              onFavouriteButtonClick={removeFavouriteRecipe}
              isFavourite={true}
            />
          ))}
        </div>
      )}

      {selectedRecipe ? (
        <RecipeModal
          recipeId={selectedRecipe.id.toString()}
          onClose={() => setSelectedRecipe(undefined)}
        />
      ) : null}
    </div>
  );
};

export default App;
