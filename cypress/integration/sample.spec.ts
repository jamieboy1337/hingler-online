/// <reference types="Cypress" />

describe("sample test", () => {
  it("should", function() {
    expect(true).to.equal(true);
    
    cy.request("http://localhost:8080/glsl/matteshader/matteshader.frag").then((resp) => {
      console.log(resp.body);
    });
  })
})