import { Injectable } from '@angular/core';
import { SolidProfileService } from './solid-profile.service';
import { SolidAuthService } from './solid-auth.service';
import { SolidDataService } from './solid-data.service';
import { addStringNoLocale, addUrl, createThing, getStringNoLocale, getThingAll, removeThing, setThing } from '@inrupt/solid-client';
import { RDF, SCHEMA_INRUPT } from '@inrupt/vocab-common-rdf';

@Injectable({
    providedIn: 'root'
})
export class NoteService {
    // session = getDefaultSession();
    private containerPath: string = ''; // User's container path

    constructor(
        private solidAuthService: SolidAuthService,
        private solidDataService: SolidDataService
    ) { }

    async initializeContainer(): Promise<void> {
        const profileService = new SolidProfileService();
        const podUrl = await profileService.getPodUrl();
        
        if (podUrl) {
          this.containerPath = `${podUrl}notes/`; // Custom folder in Pod
        }
      }
    
    async saveNote(title: string, content: string): Promise<boolean> {
        if (!this.solidAuthService.isLoggedIn() || !this.containerPath) return false;
        
        try {
            let dataset;
            dataset = await this.solidDataService.getSolidDataset(this.containerPath);
            //   try {
            //     // dataset = await this.solidDataService.getSolidDataset(this.containerPath, { fetch: this.session.fetch });
                
            //   } catch {
            //     dataset = createSolidDataset();
            //   }
        
            // Create a new Thing (note) with a unique title-based identifier
            let note = createThing({ name: title });
        
            // Add the type and content properties correctly
            note = addUrl(note, RDF.type, "http://schema.org/Note");
            note = addStringNoLocale(note, SCHEMA_INRUPT.text, content);
        
            // Add the updated Thing to the dataset
            dataset = setThing(dataset, note);
        
            // Save the dataset back to the Solid Pod
            await this.solidDataService.saveDataset(this.containerPath, dataset);
        
            return true;
          
        } catch (error) {
            console.error('Error saving note:', error);
            return false;
        }
    }
    
    async getNotes(): Promise<{ title: string; content: string }[]> {
        if (!this.solidAuthService.isLoggedIn() || !this.containerPath) return [];
    
        try {
        //   const dataset = await this.solidDataService.getSolidDataset(this.containerPath, { fetch: this.session.fetch });
            const dataset = await this.solidDataService.getSolidDataset(this.containerPath);
            return getThingAll(dataset).map((thing) => ({
                title: thing.url.split('/').pop() || '',
                content: getStringNoLocale(thing, SCHEMA_INRUPT.text) || '',
            }));
        } catch (error) {
            console.error('Error retrieving notes:', error);
            return [];
        }
    }
    
      // async updateNote(): Promise<void> {
      //   if (this.editingTitle && this.editingContent) {
      //     const success = await this.solidDataService.updateNote(this.editingTitle, this.editingContent);
      //     if (success) {
      //       this.notes = await this.solidDataService.getNotes();
      //       this.editingTitle = null;
      //       this.editingContent = '';
      //     }
      //   }
      // }
    
    async deleteNote(title: string): Promise<boolean> {
        if (!this.solidAuthService.isLoggedIn() || !this.containerPath) return false;
    
        try {
            let dataset = await this.solidDataService.getSolidDataset(this.containerPath);
            dataset = removeThing(dataset, `${this.containerPath}#${title}`);
            await this.solidDataService.saveDataset(this.containerPath, dataset);
            return true;
        } catch (error) {
            console.error('Error deleting note:', error);
            return false;
        }
    }
}
