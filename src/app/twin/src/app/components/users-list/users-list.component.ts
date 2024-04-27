import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { first } from 'rxjs/operators';


import { AccountService } from '@app/services';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [RouterLink, NgFor, NgIf],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent implements OnInit {
  users?: any[];

    constructor(private accountService: AccountService) {}

    ngOnInit() {
        this.accountService.getAll()
            .pipe(first())
            .subscribe(users => this.users = users);
    }

    deleteUser(id: string) {
        const user = this.users!.find(x => x.id === id);
        user.isDeleting = true;
        this.accountService.delete(id)
            .pipe(first())
            .subscribe(() => this.users = this.users!.filter(x => x.id !== id));
    }
}
