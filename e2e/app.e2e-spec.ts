import { MbDrawPage } from './app.po';

describe('mb-draw App', () => {
  let page: MbDrawPage;

  beforeEach(() => {
    page = new MbDrawPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('mb works!');
  });
});
