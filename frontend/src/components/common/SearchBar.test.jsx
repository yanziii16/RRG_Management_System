import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "./SearchBar";

const accommodations = ["Beach Cottage", "Garden Villa", "Family Suite"];

function SearchableList() {
  const [query, setQuery] = useState("");
  const shown = accommodations.filter((name) =>
    name.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div>
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search accommodations..."
      />
      <ul>
        {shown.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}

it("F-T2 typing in the search bar filters the list and the clear button resets it", () => {
  render(<SearchableList />);
  expect(screen.getByText("Beach Cottage")).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText("Search accommodations..."), {
    target: { value: "villa" },
  });
  expect(screen.getByText("Garden Villa")).toBeInTheDocument();
  expect(screen.queryByText("Beach Cottage")).not.toBeInTheDocument();

  fireEvent.click(screen.getByLabelText("Clear search"));
  expect(screen.getByText("Beach Cottage")).toBeInTheDocument();
});