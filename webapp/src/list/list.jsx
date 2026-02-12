import React from 'react';
import './list.css';

export function List() {
  return (
    <main>
      <h1>My Brackets</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th># of Teams</th>
            <th>Type</th>
            <th>Date Created</th>
            <th>View</th>
            <th>Edit</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2</td>
            <td>Jackson's Tournament</td>
            <td>16</td>
            <td>Single Elimination * Seeded</td>
            <td>Jan 27, 2026</td>
            <td><a href="bracket.html">View</a></td>
            <td><a href="bracket.html">Edit</a></td>
            <td><a href="bracket.html">Delete</a></td>
          </tr>
          <tr>
            <td>1</td>
            <td>Another Tournament</td>
            <td>8</td>
            <td>Double Elimination * Random</td>
            <td>Jan 23, 2026</td>
            <td><a href="bracket.html">View</a></td>
            <td><a href="bracket.html">Edit</a></td>
            <td><a href="bracket.html">Delete</a></td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
   