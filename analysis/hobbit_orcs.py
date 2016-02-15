import numpy as np
import copy

import pygraphviz as pgv
from constructStateSpace_jugs import construct_transition_matrix

try:
    import networkx as nx
except:
    print('Warning: No networkx detected; unable to do graph analyses')

class Hobbits_Orcs(object):
    def __init__(self, totals):
        """
        Parameters
        ----------
        totals : list
            A list of 3 values corresponding to (totalHobbits, totalOrcs,
            boatCapacity).
        """
        self.totals = totals
        self.start  =  (0, 0, 'L')
        self.end    = (totals[0], totals[1], 'R')

    def irreversible_moves(self, link_matrix=[]):
        if len(link_matrix) == 0:
            link_matrix = self.link_matrix(end_links=True)

        irr_moves, irr_idxs = [], []
        for ss1 in self.states:
            for ss2 in self.states:
                id1 = self.find_st_idx(ss1)
                id2 = self.find_st_idx(ss2)

                if link_matrix[id1, id2] == 1 and link_matrix[id2, id1] == 1:
                    continue

                elif link_matrix[id1, id2] == 1:
                    irr_moves.append([ss1, ss2])
                    irr_idxs.append([id1, id2])
        return irr_moves, irr_idxs

    def plot_graph(self):
        G = self.graph()
        nstates = len(self.states)
        path = nx.shortest_path(G, source=self.start, target=self.end)
        tm, eigenvals = self.transition_matrix(end_links=True)

        G1 = nx.to_agraph(G)
        G1.graph_attr['label'] = str(self.totals) + \
                ' State Space\nNum. States = {}\n' \
                'Shortest Path = {} steps\n2nd e.v. ' \
                'of Transition Matrix =  {}' \
                .format(nstates, len(path)-1, np.round(eigenvals[1].real, 5))

        for idx in xrange(len(path)-1):
            edge = G1.get_edge(str(path[idx]), str(path[idx+1]))
            edge.attr['color'] = 'red1'

        start = G1.get_node(str(self.start))
        start.attr['color'] = 'forestgreen'
        start.attr['shape'] = 'box'

        end = G1.get_node(str(self.end))
        end.attr['color'] = 'red1'
        end.attr['shape'] = 'box'

        fileid = '-'.join([str(i) for i in self.totals]) + '.png'
        G1.draw('./plots/state_spaces/' + fileid, prog='circo')


    def graph(self, end_links=False):
        G = nx.DiGraph()
        link_matrix = self.link_matrix(end_links)

        for ii in self.states:
            G.add_node(ii)

        for idx, row in enumerate(link_matrix):
            tos = np.nonzero(row)[0]

            for tt in tos:
                G.add_edge(self.states[idx], self.states[tt])
        return G, link_matrix


    def transition_matrix(self, link_matrix=[], end_links=False):
        """
        Parameters
        ----------
        link_matrix : np.array of shape (k,k) (optional)
            Binary link matrix in [from, to] format

        end_links : bool (optional)
            If True, includes transitions away from the end state in the link
            matrix. This is necessary for, e.g., running the metropolis-
            hastings walk on the network.

        Returns
        -------
        transition_matrix : np.array of shape (k,k)
            Real-valued transition matrix in [from, to] format. Sum for each
            row should be 1 unless row idx corresponds to the end node and
            end_links is False

        eigenvals : np.array of shape (k,)
            The eigenvalues (including imaginary components) for trans_matrix
            sorted by magnitude
        """
        if not len(link_matrix):
            link_matrix = self.link_matrix(end_links)
        return construct_transition_matrix(link_matrix)


    def link_matrix(self, end_links=False):
        """
        Parameters
        ----------
        end_links : bool (optional)
            If True, includes transitions away from the end state in the link
            matrix. This is necessary for, e.g., running the metropolis-
            hastings walk on the network.

        Returns
        -------
        link_matrix : np.array of shape (k,k)
            Binary link matrix in [from, to] format
        """
        state_dict = self.state_dict(end_links)
        link_matrix = np.zeros((len(self.states), len(self.states)))

        for xx, ss in enumerate(self.states):
            next_states = state_dict[tuple(ss)]
            for nn in next_states:
                yy = self.find_st_idx(tuple(nn))
                link_matrix[xx, yy] = 1
        return link_matrix


    def state_dict(self, end_links=False):
        """
        Parameters
        ----------
        end_links : bool (optional)
            If True, includes transitions away from the end state in the state
            dictionary.

        Returns
        -------
        self.states : np.array of shape (k,)
            An array of state tuples corresponding to the column + row headings
            for link_matrix. States are tuples of (#Hobbits on Right Bank,
            #Orcs on Right Bank, Position of boat)

        state_dict : dict
            A dictionary of current state : next state tuples
        """
        state_dict,added_states = self.__grow_state_dict(self.start, {})
        state_dict_old = {}

        while state_dict != state_dict_old:
            state_dict_old = copy.copy(state_dict)

            for ss in added_states:
                state_dict, stat = self.__grow_state_dict(ss, state_dict)

                if stat == []:
                    continue

                added_states += stat

        if not end_links:
            state_dict[tuple(self.end)] = []

        self.states = state_dict.keys()
        return state_dict


    def __grow_state_dict(self, cur_state, state_dict):
        """
        Given the currently occupied state (cur_state), evaluates which
        states can be reached in a single step and adds them to the
        state_dict.

        States are tuples of (#Hobbits on Right Bank, #Orcs on Right Bank,
        Position of boat)
        """
        totals = self.totals
        added_states = []
        boat_capacity = totals[-1]

        if tuple(cur_state) not in state_dict.keys():
            state_dict[tuple(cur_state)] = []
            boat_pos = cur_state[-1]
            state_right = cur_state[0:2]
            state_left = (totals[0] - state_right[0],
                          totals[1] - state_right[1])

            # coding: Hobbits = 0, Orcs = 1
            bank_from, bank_to = [], []
            if boat_pos == 'L':
                state_from = state_left
                state_to   = state_right
                bank_from = [0] * state_left[0]  + [1] * state_left[1]
                bank_to   = [0] * state_right[0] + [1] * state_right[1]

            elif boat_pos == 'R':
                state_from = state_right
                state_to   = state_left
                bank_from = [0] * state_right[0] + [1] * state_right[1]
                bank_to   = [0] * state_left[0]  + [1] * state_left[1]

            # generate all combinations of size 1:boat_capacity. We do
            # not allow the boat to be empty
            contents = []
            for ii in range(0, state_from[0]+1):
                for jj in range(0, state_from[1]+1):
                    if ii + jj <= boat_capacity:
                        contents += [(ii, jj)]
            contents.remove((0, 0))
            contents = list(set(contents))

            # now, check to see if any of the proposed moves would violate
            # the #H >= #O rule
            for n_hobbits, n_orcs in contents:
                if 0 < (state_from[0] - n_hobbits) < (state_from[1] - n_orcs):
                    continue

                if 0 < (state_to[0] + n_hobbits) < (state_to[1] + n_orcs):
                    continue

                # if the move is valid and we are going from right -> left
                if state_from == state_right:
                    new_state = (state_right[0] - n_hobbits,
                                 state_right[1] - n_orcs, 'L')
                    total_h = new_state[0] + (state_left[0] + n_hobbits)
                    total_o = new_state[1] + (state_left[1] + n_orcs)

                # if the move is valid and we are going from left -> right
                if state_to == state_right:
                    new_state = (state_right[0] + n_hobbits,
                                 state_right[1] + n_orcs, 'R')
                    total_h = new_state[0] + (state_left[0] - n_hobbits)
                    total_o = new_state[1] + (state_left[1] - n_orcs)

                assert total_h == totals[0], 'n. hobbits is not conserved'
                assert total_o == totals[1], 'n. orcs is not conserved'

                added_states.append(new_state)

                state_dict[tuple(cur_state)].append(new_state)
        return state_dict, added_states


    def find_st_idx(self, state):
        """
        Returns the index of state in the states list
        """
        states = np.asarray(self.states)
        return np.argwhere(np.bincount(np.argwhere(states == state)[:, 0]) == 3).ravel()[0]


    # look at fits for avg states visited per quartile
    # look at MTurk
    # look at time to take a move for individual participants
