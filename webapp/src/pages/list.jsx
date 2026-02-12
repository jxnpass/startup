import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/list.css';

export default function List() {
  return (
    <div className="page page-list">
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
            <td>Jackson&apos;s Tournament</td>
            <td>16</td>
            <td>Single Elimination * Seeded</td>
            <td>Jan 27, 2026</td>
            <td>
              <Link to="/bracket">View</Link>
            </td>
            <td>
              <Link to="/bracket">Edit</Link>
            </td>
            <td>
              <Link to="/bracket">Delete</Link>
            </td>
          </tr>

          <tr>
            <td>1</td>
            <td>Another Tournament</td>
            <td>8</td>
            <td>Double Elimination * Random</td>
            <td>Jan 23, 2026</td>
            <td>
              <Link to="/bracket">View</Link>
            </td>
            <td>
              <Link to="/bracket">Edit</Link>
            </td>
            <td>
              <Link to="/bracket">Delete</Link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
