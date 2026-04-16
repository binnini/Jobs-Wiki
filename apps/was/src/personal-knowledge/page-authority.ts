import type { GeneratedPersonalPage, PersonalPage, PersonalPageRef } from "./types.ts";

export interface PersonalPageReadAuthority {
  listReadablePages(userId: string): Promise<PersonalPage[]>;
  readPage(pageRef: PersonalPageRef): Promise<PersonalPage | null>;
}

export interface PersonalPageRegenerationStore {
  saveGeneratedPage(userId: string, page: GeneratedPersonalPage): Promise<PersonalPage>;
}

export class InMemoryPersonalPageAuthority
  implements PersonalPageReadAuthority, PersonalPageRegenerationStore
{
  readonly #pages = new Map<string, PersonalPage>();

  constructor(seedPages: PersonalPage[] = []) {
    for (const page of seedPages) {
      this.#pages.set(this.#key(page.ownerUserId, page.pageRef.pageId), page);
    }
  }

  async listReadablePages(userId: string): Promise<PersonalPage[]> {
    return [...this.#pages.values()]
      .filter((page) => page.ownerUserId === userId)
      .sort((left, right) => right.generatedAt.localeCompare(left.generatedAt));
  }

  async readPage(pageRef: PersonalPageRef): Promise<PersonalPage | null> {
    for (const page of this.#pages.values()) {
      if (page.pageRef.pageId === pageRef.pageId) {
        return page;
      }
    }

    return null;
  }

  async saveGeneratedPage(
    userId: string,
    page: GeneratedPersonalPage,
  ): Promise<PersonalPage> {
    const storedPage: PersonalPage = {
      ...page,
      ownerUserId: userId,
      visibility: "applied",
    };

    this.#pages.set(this.#key(userId, page.pageRef.pageId), storedPage);

    return storedPage;
  }

  #key(userId: string, pageId: string): string {
    return `${userId}:${pageId}`;
  }
}
