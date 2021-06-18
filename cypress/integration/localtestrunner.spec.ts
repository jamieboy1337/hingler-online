/// <reference types="Cypress" />
import { FileLoader } from "../../client/ts/loaders/FileLoader";

describe("sample test", () => {
  it("should", function() {
    expect(true).to.equal(true);
    cy.visit("http://localhost:8080/browser/simpletest.html")
      .wait(500)
      .get(".failures").find("em").contains(0);
  })
})