import { render, screen, fireEvent } from "@testing-library/react";
import { Loading, EmptyState, ErrorMessage } from "./Loading";

it("F-T1 loading state shows the server wake-up message", () => {
  render(<Loading message="Starting the server. This can take up to a minute." />);
  expect(
    screen.getByText("Starting the server. This can take up to a minute.")
  ).toBeInTheDocument();
});

it("F-T3 empty state explains the list is empty and what to do next", () => {
  render(
    <EmptyState
      title="No reservations yet"
      description="Book a cottage or room to see your reservations here."
    />
  );
  expect(screen.getByText("No reservations yet")).toBeInTheDocument();
  expect(
    screen.getByText("Book a cottage or room to see your reservations here.")
  ).toBeInTheDocument();
});

it("Extra: error message shows the problem and Try again calls onRetry", () => {
  const onRetry = vi.fn();
  render(
    <ErrorMessage message="Cannot reach the server." onRetry={onRetry} />
  );
  expect(screen.getByText("Cannot reach the server.")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Try again"));
  expect(onRetry).toHaveBeenCalledTimes(1);
});